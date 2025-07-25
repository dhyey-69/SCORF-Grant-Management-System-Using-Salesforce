import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class GpsFormModal extends LightningElement {
    @api formData;
    @track isConsentChecked = false;

    // Checkbox change handler
    handleConsentChange(event) {
        this.isConsentChecked = event.target.checked;
    }

    get partnersData() {
        if (this.formData && this.formData.partnerName) {
            return [
                { id: 'partner-1', index: 1, name: this.formData.partnerName }
            ];
        }
        return [];
    }

    get hasPartners() {
        return this.partnersData.length > 0;
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
        console.log('Close Clicked');
    }

    handleEdit() {
        this.dispatchEvent(new CustomEvent('edit'));
        console.log('Edit Clicked');
    }

    handleSubmit() {
        console.log('Submit Clicked');
        if (!this.isConsentChecked) {
            // Show toast if checkbox not checked
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Confirmation Required',
                    message: 'Please check the confirmation box to proceed.',
                    variant: 'warning'
                })
            );
            return;
        }
        this.dispatchEvent(new CustomEvent('submit', { detail: { formData: this.formData } }));
    }

    handleViewPartner(event) {
        this.dispatchEvent(new CustomEvent('viewpartner', { detail: { partnerId: event.target.dataset.id } }));
        console.log('Partner View Clicked');
    }

    handleEditPartner(event) {
        this.dispatchEvent(new CustomEvent('editpartner', { detail: { partnerId: event.target.dataset.id } }));
        console.log('Partner Edit Clicked');
    }

    handleDeletePartner(event) {
        this.dispatchEvent(new CustomEvent('deletepartner', { detail: { partnerId: event.target.dataset.id } }));
        console.log('Partner Delete Clicked');
    }
}