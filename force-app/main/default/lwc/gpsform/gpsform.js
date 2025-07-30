import { LightningElement, track, wire } from 'lwc';
import MyImage from '@salesforce/resourceUrl/scorf';
import getAbatementStrategyPicklists from '@salesforce/apex/GpsformController.getAbatementStrategyPicklists';
import getFundingAppPicklists from '@salesforce/apex/GpsformController.getFundingAppPicklists';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import saveStep1 from '@salesforce/apex/FundingApplicationService.saveStep1';
// import saveFormData from '@salesforce/apex/GpsformController.saveFormData';

export default class Gpsform extends NavigationMixin(LightningElement) {
    @track currentStep = 1;
    imageUrl = MyImage;
    fileInput;
    @track fileName = '';
    @track isFileUploaded = false;
    @track isLoading = true;
    @track error;
    @track coreStrategies = [];
    @track coreStrategiesOptions = [];
    @track coreAbatementStrategyOptions = [];
    @track fundTypeOptions = [];
    @track entityTypeOptions = [];
    @track countyOptions = [];
    stateOptions = [];
    filePayload = null;
    @track showModal = false; 

    formDataTarget = {};
    @track formData = new Proxy(this.formDataTarget, {
        get: (target, prop) => prop in target ? target[prop] : '',
        set: (target, prop, value) => (target[prop] = value, true)
    });

    initialContinuationOptions = [
        { label: 'Initial', value: 'Initial' },
        { label: 'Continuation', value: 'Continuation' }
    ];
    yesNoOptions = [
        { label: 'No', value: 'No' },
        { label: 'Yes', value: 'Yes' }
    ];

    @wire(getFundingAppPicklists)
    wiredFundingPicklists({ error, data }) {
        if (data) {
            this.fundTypeOptions = data.Request_Type__c || [];
            this.entityTypeOptions = data.Entity_Type__c || [];
            this.countyOptions = data.Please_select_the_appropriate_county__c || [];
            this.statePSAOptions = data.State_PSA__c || [];
            this.stateSCEISOptions = data.State_SCEIS__c || [];
        } else if (error) {
            console.error('Error loading Funding picklists:', error);
        }
    }


    @wire(getAbatementStrategyPicklists)
    wiredPicklists({ error, data }) {
        if (data) {
            this.setupStrategies(data);
        } else if (error) {
            console.error('Error fetching picklist data:', error);
        }
    }

    setupStrategies(data) {
        const coreField = 'Core_Strategies__c';
        const abatementField = 'Core_Abatement_Strategies__c';
        this.coreStrategiesOptions = data[coreField] || [];
        this.coreAbatementStrategyOptions = data[abatementField] || [];

        this.coreStrategies = this.coreStrategiesOptions.map((parent, index) => {
            const letter = String.fromCharCode(65 + index);
            const prefix = parent.label.split(':')[0].trim();
            const subStrategies = this.coreAbatementStrategyOptions
                .filter(child => child.value.startsWith(`${prefix}.`))
                .map((sub, i) => this.createDefaultSub(sub, `${letter}${i + 1}`));

            return {
                label: parent.label,
                value: parent.value,
                letter,
                expanded: false,
                iconName: 'utility:chevrondown',
                subStrategies
            };
        });
    }

    createDefaultSub(sub, number) {
        return {
            ...sub,
            number,
            expanded: false,
            iconName: 'utility:chevrondown',
            budgetAmount: null,
            initialContinuation: '',
            budgetNarrative: '',
            implementationPlan: '',
            outcomeMeasures: '',
            processMeasures: '',
            personnelList: [this.createPersonnel()],
            budgetList: [this.createBudgetItem()]
        };
    }

    createPersonnel() {
        return {
            id: this.generateUniqueId(),
            name: '',
            position: '',
            salary: null,
            effort: '',
            totalCharged: null
        };
    }

    createBudgetItem() {
        return {
            id: this.generateUniqueId(),
            item: '',
            purpose: '',
            calculation: '',
            totalCharged: null
        };
    }

    updateNestedField(type, event) {
        const { strategy, sub, recordid, field } = event.currentTarget.dataset;
        const value = event.target.value;

        this.coreStrategies = this.coreStrategies.map(s => s.value === strategy ? {
            ...s,
            subStrategies: s.subStrategies.map(ss => ss.value === sub ? {
                ...ss,
                [type]: recordid
                    ? ss[type].map(i => i.id === recordid ? { ...i, [field]: value } : i)
                    : value
            } : ss)
        } : s);
    }

    handleSubStrategyFieldChange(e) { this.updateNestedField(e.target.dataset.field, e); this.updateCalculatedFields(); }
    handlePersonnelFieldChange(e) { this.updateNestedField('personnelList', e); }
    handleBudgetFieldChange(e) { this.updateNestedField('budgetList', e); }

    clearSubStrategy(event) {
        const { strategy, sub } = event.currentTarget.dataset;
        this.coreStrategies = this.coreStrategies.map(s => s.value === strategy ? {
            ...s,
            subStrategies: s.subStrategies.map(ss => ss.value === sub ? {
                ...this.createDefaultSub(ss, ss.number)
            } : ss)
        } : s);
        this.updateCalculatedFields();
    }

    updateCalculatedFields() {
        let total = 0;
        this.coreStrategies.forEach(s => {
            s.subStrategies.forEach(ss => {
                const val = parseFloat(ss.budgetAmount);
                if (!isNaN(val)) total += val;
            });
        });
        this.formData.Total_Project_Budget__c = total;

        const carry = parseFloat(this.formData.Minus_Estimated_Carry_Forward_Amount__c) || 0;
        const interest = parseFloat(this.formData.Minus_Estimated_Interest_Earned__c) || 0;
        this.formData.Total_Amount_Requested__c = total - carry - interest;
    }

    toggleStrategyOrSub(type, event) {
        const { strategy, sub } = event.currentTarget.dataset;
        this.coreStrategies = this.coreStrategies.map(s => {
            if (s.value !== strategy) return s;
            if (type === 'strategy') {
                return { ...s, expanded: !s.expanded, iconName: s.expanded ? 'utility:chevrondown' : 'utility:chevronup' };
            }
            return {
                ...s,
                subStrategies: s.subStrategies.map(ss => ss.value === sub ? {
                    ...ss,
                    expanded: !ss.expanded,
                    iconName: ss.expanded ? 'utility:chevrondown' : 'utility:chevronup'
                } : ss)
            };
        });
    }

    toggleStrategy(e) { this.toggleStrategyOrSub('strategy', e); }
    toggleSubStrategy(e) { this.toggleStrategyOrSub('sub', e); }

    validateCurrentStep(stepSelector = '.step-form') {
        const container = this.template.querySelector(stepSelector);
        if (!container) return true;

        const inputs = container.querySelectorAll('[data-field]');
        const missing = [], invalid = [];

        inputs.forEach(input => {
            const field = input.dataset.field;
            const pattern = input.dataset.pattern;
            const required = input.hasAttribute('data-required');
            const condition = input.dataset.requiredIf;

            let validate = required;
            if (condition) {
                const [dep, val] = condition.split('=');
                validate = this.formData[dep] === val;
            }

            let value = this.formData[field];
            if (typeof value === 'string') {
                value = value.trim();
            }
            const empty = value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0);


            let hasError = false;
            input.classList.remove('error');

            if (validate && empty) {
                missing.push(field);
                hasError = true;
            }

            if (!empty && pattern && !new RegExp(pattern).test(value)) {
                invalid.push(field);
                hasError = true;
            }


            if (hasError) input.classList.add('error');
        });

        if (stepSelector === '.step-form-1' && (!this.formData.authorizationLetter || this.formData.authorizationLetter.trim() === '')) {
            missing.push('authorizationLetter');
        }

        if (missing.length || invalid.length) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Validation Error',
                message: `${missing.length ? 'Missing required fields. ' : ''}${invalid.length ? 'Some fields have invalid format.' : ''}`,
                variant: 'error'
            }));
            return false;
        }
        return true;
    }

    handleInputChange(e) {
        const { field } = e.target.dataset;
        const value = e.detail?.value || e.target.value;
        if (!field) return;

        this.formData[field] = value;

        if (field === 'Entity_Type__c' && value !== 'Other') this.formData.Please_Specify_Other_Entity_Type__c = '';
        if (field === 'Any_Potential_Conflict_with_SC_Recovery__c' && value !== 'Yes') this.formData.conflictExplanation = '';
        if (field === 'Collaborating_with_Other_GPS_Entity__c' && value !== 'Yes') this.formData.collaboratingCounties = '';
        if (['Minus_Estimated_Carry_Forward_Amount__c', 'Minus_Estimated_Interest_Earned__c'].includes(field)) this.updateCalculatedFields();
    }

    handleCoreAbatementStrategyChange(e) {
        this.formData.coreAbatementStrategy = e.detail.value.join(';');
    }

    handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.fileName = file.name;
        this.formData.authorizationLetter = file.name;
        this.isFileUploaded = true;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];

            this.filePayload = {
                name: file.name,
                contentType: file.type || 'application/pdf',
                base64
            };

            this.formData.authorizationLetterBase64 = base64;
            this.formData.authorizationLetterName = file.name;

        };
        reader.readAsDataURL(file);
    }


    handleDeleteFile() {
        this.fileName = '';
        this.formData.authorizationLetter = '';
        this.formData.authorizationLetterBase64 = '';
        this.formData.authorizationLetterName = '';
        this.isFileUploaded = false;

        if (this.fileInput) {
            this.fileInput.value = null;
        }
    }


    generateUniqueId() {
        return Math.random().toString(36).substring(2, 9);
    }

    addOrRemoveItem(type, action, e) {
        const { strategy, sub, recordid } = e.currentTarget.dataset;
        this.coreStrategies = this.coreStrategies.map(s => s.value === strategy ? {
            ...s,
            subStrategies: s.subStrategies.map(ss => ss.value === sub ? {
                ...ss,
                [type]: action === 'add'
                    ? [...ss[type], type === 'personnelList' ? this.createPersonnel() : this.createBudgetItem()]
                    : ss[type].filter(i => i.id !== recordid)
            } : ss)
        } : s);
    }

    addPersonnel(e) { this.addOrRemoveItem('personnelList', 'add', e); }
    removePersonnel(e) { this.addOrRemoveItem('personnelList', 'remove', e); }
    addBudgetItem(e) { this.addOrRemoveItem('budgetList', 'add', e); }
    removeBudgetItem(e) { this.addOrRemoveItem('budgetList', 'remove', e); }

    handleUploadClick() {
        if (!this.fileInput) this.fileInput = this.template.querySelector('.file-input');
        if (this.fileInput) this.fileInput.click();
    }

    setTodayDateIfMissing() {
        if (!this.formData.Date__c) {
            this.formData.Date__c = new Date().toISOString().split('T')[0];
        }
    }

    handleStepClick(e) {
        this.currentStep = parseInt(e.currentTarget.dataset.step, 10);
        if (this.currentStep === 4) this.setTodayDateIfMissing();
    }

    handleNext() {
        const stepSelector = `.step-form-${this.currentStep}`;
        
        if (!this.validateCurrentStep(stepSelector)) return;

        if (this.currentStep === 3 && !this.validateBudgetAmounts()) {
            return;
        }

        this.currentStep++;
        if (this.currentStep === 4) this.setTodayDateIfMissing();
    }


    handlePrevious() {
        if (this.currentStep > 1) this.currentStep--;
    }

    handleSubmit() { 
        const stepSelector = `.step-form-${this.currentStep}`;
        if (!this.validateCurrentStep(stepSelector)) return;

        console.log('Form submitted:', JSON.stringify(this.formData, null, 2)); 
        this.showModal = true; 
        console.log('Save & Preview is Clicked');
    }


    handleSaveExit() {
        // Step validation
        
        const stepSelector = `.step-form-1`;
        if (!this.validateCurrentStep(stepSelector)) {
            console.warn('Validation failed for Step 1');
            return;
        }

        console.log('🚀 Submitted formData:', JSON.stringify(this.formData, null, 2));

        const multiPicklistFields = ['Please_select_the_appropriate_county__c'];
        multiPicklistFields.forEach((field) => {
            if (Array.isArray(this.formData[field])) {
                this.formData[field] = this.formData[field].join(';');
            }
        });

        try {
            this.isLoading = true;

            const recordId = saveStep1({ formData: this.formData });

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: `Funding Application saved. Id: ${recordId}`,
                    variant: 'success'
                })
            );

            this.resetForm();
            this.navigateToHome();

        } catch (e) {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error saving record',
                    message: this.reduceErrors(e).join(', '),
                    variant: 'error'
                })
            );
        } finally {
            this.isLoading = false;
        }
    }


    resetForm() {
        // Nuke formData
        this.formDataTarget = {};
        this.formData = new Proxy(this.formDataTarget, {
            get: (target, prop) => (prop in target ? target[prop] : ''),
            set: (target, prop, value) => ((target[prop] = value), true)
        });

        // Clean file state
        this.filePayload = null;
        this.fileName = '';
        this.isFileUploaded = false;
        if (this.fileInput) this.fileInput.value = null;

        // Reset UI state
        this.currentStep = 1;
    }

    navigateToHome() {
        // Experience Cloud named page (assuming "Home")
        try {
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: {
                    name: 'Home'
                }
            });
        } catch (e) {
            // fallback to root url in case it's not a community
            this[NavigationMixin.Navigate]({
                type: 'standard__webPage',
                attributes: {
                    url: '/'
                }
            });
        }
    }

    reduceErrors(errors) {
        if (!Array.isArray(errors)) {
            errors = [errors];
        }
        return (
            errors
                .filter((e) => !!e)
                .map((e) => {
                    if (Array.isArray(e.body)) {
                        return e.body.map((err) => err.message);
                    } else if (e?.body?.message) {
                        return e.body.message;
                    } else if (e?.message) {
                        return e.message;
                    }
                    return e.statusText || 'Unknown error';
                })
                .reduce((prev, curr) => prev.concat(curr), [])
                .filter((message) => !!message)
        );
    }



    handleModalClose() {
        this.showModal = false;
    }

    handleAddPartner() { console.log('Add Partner clicked'); }

    // UI Helpers
    get headerStyle() { return `background-image: url(${this.imageUrl});`; }
    get progressStyle() {
        const stepDistance = 200;
        const offset = this.currentStep === 3 ? 0.1 : this.currentStep === 4 ? 0.2 : 0;
        return `--progress-width: ${stepDistance * (this.currentStep - 1 + offset)}px;`;
    }
    get selectedCoreAbatementStrategy() { return this.formData.coreAbatementStrategy?.split(';') ?? []; }
    get isStep1() { return this.currentStep === 1; }
    get isStep2() { return this.currentStep === 2; }
    get isStep3() { return this.currentStep === 3; }
    get isStep4() { return this.currentStep === 4; }
    get isOtherEntityType() { return this.formData.Entity_Type__c === 'Other'; }
    get hasConflict() { return this.formData.Any_Potential_Conflict_with_SC_Recovery__c === 'Yes'; }
    get isCollaborating() { return this.formData.Collaborating_with_Other_GPS_Entity__c === 'Yes'; }

    // Dynamic Class Helpers
    get step1CircleClass() { return `step-circle${this.currentStep >= 1 ? ' active' : ''}`; }
    get step2CircleClass() { return `step-circle${this.currentStep >= 2 ? ' active' : ''}`; }
    get step3CircleClass() { return `step-circle${this.currentStep >= 3 ? ' active' : ''}`; }
    get step4CircleClass() { return `step-circle${this.currentStep >= 4 ? ' active' : ''}`; }
    get connector1Class() { return `step-connector${this.currentStep >= 2 ? ' active' : ''}`; }
    get connector2Class() { return `step-connector${this.currentStep >= 3 ? ' active' : ''}`; }
    get connector3Class() { return `step-connector${this.currentStep >= 4 ? ' active' : ''}`; }

    validateBudgetAmounts() {
        let isValid = true;
        let errorFound = false;
        let firstErrorMessage = '';

        this.coreStrategies = this.coreStrategies.map(strategy => {
            return {
                ...strategy,
                subStrategies: strategy.subStrategies.map(sub => {
                    let totalCharged = 0;

                    sub.personnelList.forEach(p => {
                        const val = parseFloat(p.totalCharged);
                        if (!isNaN(val)) totalCharged += val;
                    });

                    sub.budgetList.forEach(b => {
                        const val = parseFloat(b.totalCharged);
                        if (!isNaN(val)) totalCharged += val;
                    });

                    const budgetAmount = parseFloat(sub.budgetAmount) || 0;
                    let validationError = '';

                    if (totalCharged !== budgetAmount) {
                        validationError = `Total Charged (${totalCharged}) must exactly equal Budget Amount (${budgetAmount}).`;
                        isValid = false;
                        errorFound = true;

                        if (!firstErrorMessage) {
                            firstErrorMessage = validationError;
                        }
                    }

                    return {
                        ...sub,
                        validationError
                    };
                })
            };
        });

        if (errorFound) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Budget Validation Error',
                    message: firstErrorMessage,
                    variant: 'error'
                })
            );
        }

        return isValid;
    }

}