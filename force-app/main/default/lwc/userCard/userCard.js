import { LightningElement, track, wire } from 'lwc';
import getUserInfo from '@salesforce/apex/UserInfoController.getUserInfo';

export default class UserCard extends LightningElement {
    @track activeNav = 'dashboard';
    @track user = {};

    @wire(getUserInfo)
    wiredUser({ error, data }) {
        if (data) {
            this.user = data;
        } else if (error) {
            console.error('Error:', JSON.stringify(error));
        }
    }

    connectedCallback() {
        // Just read initialNav to highlight the sidebar (don't remove here)
        const initialNav = window.sessionStorage.getItem('initialNav');
        if (initialNav) {
            this.activeNav = initialNav;
        }
    }

    handleNavClick(event) {
        const navItem = event.currentTarget.dataset.nav;
        this.activeNav = navItem;

        // Notify MainLayout to switch view
        window.dispatchEvent(new CustomEvent('sidebarnavigate', {
            detail: { selectedNav: navItem }
        }));
    }

    // computed classes for active highlight
    get dashboardClass() { return this.activeNav === 'dashboard' ? 'nav-item active' : 'nav-item'; }
    get projectsClass() { return this.activeNav === 'projects' ? 'nav-item active' : 'nav-item'; }
    get letterClass() { return this.activeNav === 'letter' ? 'nav-item active' : 'nav-item'; }
    get reportsClass() { return this.activeNav === 'reports' ? 'nav-item active' : 'nav-item'; }
    get closeoutClass() { return this.activeNav === 'closeout' ? 'nav-item active' : 'nav-item'; }
}