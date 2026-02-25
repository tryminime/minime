describe('Landing Page E2E Tests', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('loads the homepage successfully', () => {
        cy.contains('Your Work Intelligence, Amplified').should('be.visible');
    });

    it('has functional navigation links', () => {
        // Check header navigation
        cy.get('nav').within(() => {
            cy.contains('Features').should('be.visible');
            cy.contains('Pricing').should('be.visible');
            cy.contains('About').should('be.visible');
        });
    });

    it('displays hero CTA buttons', () => {
        cy.contains('Join Beta Waitlist').should('be.visible');
        cy.contains('Watch Demo').should('be.visible');
    });

    it('navigates to waitlist page when CTA is clicked', () => {
        cy.contains('Join Beta Waitlist').click();
        cy.url().should('include', '/waitlist');
        cy.contains('Join the Beta').should('be.visible');
    });

    it('displays all 6 feature cards', () => {
        cy.get('[data-testid="feature-card"]').should('have.length', 6);
    });

    it('shows pricing preview section', () => {
        cy.contains('Choose Your Plan').should('be.visible');
        cy.contains('Free').should('be.visible');
        cy.contains('Pro').should('be.visible');
        cy.contains('Enterprise').should('be.visible');
    });

    it('has working footer links', () => {
        cy.get('footer').within(() => {
            cy.contains('Privacy Policy').should('have.attr', 'href', '/legal/privacy');
            cy.contains('Terms of Service').should('have.attr', 'href', '/legal/terms');
        });
    });

    it('is responsive on mobile', () => {
        cy.viewport('iphone-x');
        cy.contains('Your Work Intelligence, Amplified').should('be.visible');

        //Mobile menu should be present
        cy.get('[aria-label="Toggle menu"]').should('exist');
    });

    it('passes accessibility checks', () => {
        cy.checkA11y();
    });
});
