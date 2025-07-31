// fundingApplicationDashboard.js
import { LightningElement, track, wire } from 'lwc';
import getFundingApplications from '@salesforce/apex/FundingApplicationController.getFundingApplications';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class ProjecTable extends NavigationMixin(LightningElement) {
    @track fundingApplications = [];
    @track displayedRecords = [];
    @track showAll = false;
    @track isLoading = false;
    
    // Dashboard counts
    @track approvedCount = 0;
    @track rejectedCount = 0;
    @track revisionCount = 0;
    @track totalCount = 0;

    // Constants
    RECORDS_PER_PAGE = 10;

    @wire(getFundingApplications)
    wiredFundingApplications({ error, data }) {
        if (data) {
            this.fundingApplications = this.processRecords(data);
            this.calculateCounts();
            this.updateDisplayedRecords();
        } else if (error) {
            this.showToast('Error', 'Error loading funding applications', 'error');
            console.error('Error loading funding applications:', error);
        }
    }

    processRecords(records) {
        return records.map((record, index) => {
            const processedRecord = { ...record };
            
            // Format date
            if (record.Date__c) {
                const date = new Date(record.Date__c);
                processedRecord.formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            }
            
            // Determine icon type based on status
            const status = record.Application_Status__c?.toLowerCase();
            processedRecord.showEditIcon = (status === 'draft' || status === 'revisions requested');
            
            // Add CSS classes for status
            processedRecord.statusClass = this.getStatusClass(record.Application_Status__c);
            
            // Add row class for editable records
            processedRecord.rowClass = processedRecord.showEditIcon ? 'row-editable' : '';
            
            return processedRecord;
        });
    }

    getStatusClass(status) {
        if (!status) return '';
        
        const statusLower = status.toLowerCase();
        const statusMap = {
            'submitted': 'status-submitted',
            'resubmitted': 'status-resubmitted',
            'approved': 'status-approved',
            'rejected': 'status-rejected',
            'draft': 'status-draft',
            'revisions requested': 'status-revisions',
            'approve with conditions': 'status-approve-conditions'
        };
        
        return statusMap[statusLower] || 'status-submitted';
    }

    calculateCounts() {
        this.totalCount = this.fundingApplications.length;
        this.approvedCount = this.fundingApplications.filter(record => 
            record.Application_Status__c?.toLowerCase() === 'approved'
        ).length;
        this.rejectedCount = this.fundingApplications.filter(record => 
            record.Application_Status__c?.toLowerCase() === 'rejected'
        ).length;
        this.revisionCount = this.fundingApplications.filter(record => 
            record.Application_Status__c?.toLowerCase() === 'revisions requested'
        ).length;
    }

    updateDisplayedRecords() {
        if (this.showAll) {
            this.displayedRecords = [...this.fundingApplications];
        } else {
            this.displayedRecords = this.fundingApplications.slice(0, this.RECORDS_PER_PAGE);
        }
    }

    get showViewMore() {
        return this.fundingApplications.length > this.RECORDS_PER_PAGE;
    }

    get viewMoreLabel() {
        return this.showAll ? 'View Less' : 'View More';
    }

    handleViewMore() {
        this.showAll = !this.showAll;
        this.updateDisplayedRecords();
    }

    handleEdit(event) {
        const recordId = event.target.dataset.id;
        this.navigateToRecordEditPage(recordId);
    }

    handleView(event) {
        const recordId = event.target.dataset.id;
        this.navigateToRecordViewPage(recordId);
    }

    navigateToRecordEditPage(recordId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Funding_Application__c',
                actionName: 'edit'
            }
        });
    }

    navigateToRecordViewPage(recordId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Funding_Application__c',
                actionName: 'view'
            }
        });
    }

    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }

    // Refresh data method
    refreshData() {
        this.isLoading = true;
        return refreshApex(this.wiredFundingApplicationsResult)
            .then(() => {
                this.isLoading = false;
                this.showToast('Success', 'Data refreshed successfully', 'success');
            })
            .catch(error => {
                this.isLoading = false;
                console.error('Error refreshing data:', error);
                this.showToast('Error', 'Error refreshing data', 'error');
            });
    }
}