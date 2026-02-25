// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for login
Cypress.Commands.add('login', (email: string, password: string) => {
    cy.visit('/auth/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
});

// Custom command for API requests with auth
Cypress.Commands.add('apiRequest', (method: string, url: string, body?: any) => {
    const token = window.localStorage.getItem('auth_token');

    return cy.request({
        method,
        url: `${Cypress.env('apiUrl')}${url}`,
        body,
        headers: {
            Authorization: token ? `Bearer ${token}` : '',
        },
    });
});

// Check accessibility
Cypress.Commands.add('checkA11y', () => {
    cy.injectAxe();
    // @ts-ignore - Cypress types for checkA11y from cypress-axe conflict with the custom command
    cy.checkA11y(null, {

        includedImpacts: ['critical', 'serious'],
    });
});

// Declare custom commands for TypeScript
declare global {
    namespace Cypress {
        interface Chainable {
            login(email: string, password: string): Chainable<void>;
            apiRequest(method: string, url: string, body?: any): Cypress.Chainable<Cypress.Response<any>>;
        }
    }
}


export { };
