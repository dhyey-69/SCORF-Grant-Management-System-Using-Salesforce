import { LightningElement, api, track } from 'lwc';

export default class GpsFormModal extends LightningElement {
    @api formData; // data coming from parent

    // Getter to ensure partners array exists and has proper structure
    get partnersData() {
        if (this.formData && this.formData.partners) {
            return this.formData.partners.map((partner, index) => ({
                ...partner,
                index: index + 1,
                id: partner.id || `partner-${index}`
            }));
        }
        return [];
    }

    // Check if partners exist
    get hasPartners() {
        return this.partnersData && this.partnersData.length > 0;
    }

    // Format display values for better presentation
    get displayFormData() {
        if (!this.formData) return {};
        
        return {
            ...this.formData,
            // Format boolean values
            servabilityApproval: this.formatBoolean(this.formData.servabilityApproval),
            collaboratingWithOtherGPS: this.formatBoolean(this.formData.collaboratingWithOtherGPS),
            isBellwetherPlaintiff: this.formatBoolean(this.formData.isBellwetherPlaintiff),
            isLitigatingSubdivision: this.formatBoolean(this.formData.isLitigatingSubdivision),
            conflictOfInterest: this.formatBoolean(this.formData.conflictOfInterest),
            existingEfforts: this.formatBoolean(this.formData.existingEfforts),
            consentGiven: this.formatBoolean(this.formData.consentGiven),
            
            // Handle empty or null values
            otherEntityType: this.formData.otherEntityType || 'N/A',
            collaboratingCounties: this.formData.collaboratingCounties || 'N/A',
            conflictExplanation: this.formData.conflictExplanation || 'N/A',
            paymentAddress2: this.formData.paymentAddress2 || '',
            subdivisionAddress2: this.formData.subdivisionAddress2 || '',
            
            // Ensure partners array
            partners: this.partnersData
        };
    }

    formatBoolean(value) {
        if (value === true || value === 'true' || value === 'Yes') return 'Yes';
        if (value === false || value === 'false' || value === 'No') return 'No';
        return value || 'No';
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleEdit() {
        this.dispatchEvent(new CustomEvent('edit'));
    }

    handleSubmit() {
        this.dispatchEvent(new CustomEvent('submit', {
            detail: {
                formData: this.formData
            }
        }));
    }

    // Partner action handlers
    handleViewPartner(event) {
        const partnerId = event.target.dataset.id;
        this.dispatchEvent(new CustomEvent('viewpartner', {
            detail: {
                partnerId: partnerId
            }
        }));
    }

    handleEditPartner(event) {
        const partnerId = event.target.dataset.id;
        this.dispatchEvent(new CustomEvent('editpartner', {
            detail: {
                partnerId: partnerId
            }
        }));
    }

    handleDeletePartner(event) {
        const partnerId = event.target.dataset.id;
        this.dispatchEvent(new CustomEvent('deletepartner', {
            detail: {
                partnerId: partnerId
            }
        }));
    }

    // Lifecycle methods
    connectedCallback() {
        // Any initialization logic
        console.log('GPS Form Modal connected with data:', this.formData);
    }

    renderedCallback() {
        // Any post-render logic
        // For example, you might want to focus on certain elements or adjust styling
    }

    // Utility method to check if a field has a value
    hasValue(field) {
        return field && field !== '' && field !== 'N/A' && field !== null && field !== undefined;
    }

    // Method to get formatted address
    getFormattedAddress(address1, address2, city, state, zip) {
        let addressParts = [];
        if (address1) addressParts.push(address1);
        if (address2) addressParts.push(address2);
        if (city) addressParts.push(city);
        if (state) addressParts.push(state);
        if (zip) addressParts.push(zip);
        return addressParts.join(', ');
    }
}