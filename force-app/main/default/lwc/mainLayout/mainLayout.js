import { LightningElement, track } from 'lwc';

export default class MainLayout extends LightningElement {
    @track currentView = 'dashboard';
    globalNavHandler;

    connectedCallback() {
        // Event listener for nav changes
        this.globalNavHandler = this.handleGlobalNav.bind(this);
        window.addEventListener('sidebarnavigate', this.globalNavHandler);

        // Initialize from session storage first
        const initialNav = window.sessionStorage.getItem('initialNav');
        if (initialNav) {
            this.currentView = initialNav;
            console.log('Initial view from sessionStorage:', this.currentView);
            // clear AFTER MainLayout reads it
            window.sessionStorage.removeItem('initialNav');
        }
    }

    disconnectedCallback() {
        window.removeEventListener('sidebarnavigate', this.globalNavHandler);
    }

    handleGlobalNav(event) {
        if (event?.detail?.selectedNav) {
            this.currentView = event.detail.selectedNav;
            console.log('Global navigation changed to:', this.currentView);
        }
    }

    get isDashboard() { return this.currentView === 'dashboard'; }
    get isProjects() { return this.currentView === 'projects'; }
    get isLetter() { return this.currentView === 'letter'; }
    get isReports() { return this.currentView === 'reports'; }
    get isCloseout() { return this.currentView === 'closeout'; }
}