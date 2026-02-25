describe('Waitlist Form E2E Tests', () => {
    beforeEach(() => {
        cy.visit('/waitlist');
    });

    it('displays the waitlist form', () => {
        cy.contains('Join the Beta').should('be.visible');
        cy.get('input[name="firstName"]').should('be.visible');
        cy.get('input[name="lastName"]').should('be.visible');
        cy.get('input[name="email"]').should('be.visible');
    });

    it('validates required fields', () => {
        cy.get('button[type="submit"]').click();

        // Check for validation errors
        cy.contains('required').should('exist');
    });

    it('validates email format', () => {
        cy.get('input[name="email"]').type('invalid-email');
        cy.get('button[type="submit"]').click();

        cy.contains('valid email').should('exist');
    });

    it('successfully submits the form with valid data', () => {
        // Intercept API call
        cy.intercept('POST', '/api/v1/waitlist', {
            statusCode: 200,
            body: {
                success: true,
                message: 'Welcome to the waitlist!',
                position: 732,
            },
        }).as('submitWaitlist');

        // Fill form
        cy.get('input[name="firstName"]').type('John');
        cy.get('input[name="lastName"]').type('Doe');
        cy.get('input[name="email"]').type('john.doe@example.com');
        cy.get('input[name="company"]').type('Acme Corp');
        cy.get('select[name="role"]').select('Developer');
        cy.get('textarea[name="useCase"]').type('Building productivity tools');

        // Submit
        cy.get('button[type="submit"]').click();

        // Wait for API call
        cy.wait('@submitWaitlist');

        // Check success message
        cy.contains('Welcome to the waitlist').should('be.visible');
    });

    it('displays form with progress indicator', () => {
        cy.contains('732 / 1000 spots filled').should('be.visible');

        // Check progress bar
        cy.get('[role="progressbar"]').should('exist');
    });

    it('shows FAQ section', () => {
        cy.contains('When will I get access').should('be.visible');
        cy.contains('What features are included').should('be.visible');
    });

    it('is mobile responsive', () => {
        cy.viewport('iphone-x');
        cy.get('input[name="email"]').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible');
    });
});
