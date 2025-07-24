import { LightningElement, track, wire } from 'lwc';
import getUserInfo from '@salesforce/apex/UserInfoController.getUserInfo';

export default class SidebarComponent extends LightningElement {
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

    handleNavClick(event) {
        const navItem = event.currentTarget.dataset.nav;

        this.template.querySelectorAll('.nav-item').forEach(item =>
            item.classList.remove('active')
        );

        event.currentTarget.classList.add('active');
        this.activeNav = navItem;

        this.dispatchEvent(new CustomEvent('navigate', {
            detail: { selectedNav: navItem }
        }));

        console.log('Navigation selected:', navItem);
    }
}