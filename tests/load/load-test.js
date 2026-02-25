import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
    stages: [
        { duration: '2m', target: 100 }, // Ramp up to 100 users
        { duration: '5m', target: 100 }, // Stay at 100 users
        { duration: '2m', target: 500 }, // Ramp up to 500 users
        { duration: '5m', target: 500 }, // Stay at 500 users
        { duration: '2m', target: 0 },   // Ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
        http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
        errors: ['rate<0.01'],
    },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
    // Test 1: Homepage
    let response = http.get(`${BASE_URL}/`);
    check(response, {
        'homepage status is 200': (r) => r.status === 200,
        'homepage loads in <2s': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);

    sleep(1);

    // Test 2: Pricing page
    response = http.get(`${BASE_URL}/pricing`);
    check(response, {
        'pricing page status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(1);

    // Test 3: Waitlist page
    response = http.get(`${BASE_URL}/waitlist`);
    check(response, {
        'waitlist page status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(1);

    // Test 4: API endpoint (waitlist submission)
    const payload = JSON.stringify({
        firstName: `TestUser${__VU}`,
        lastName: 'LoadTest',
        email: `loadtest${__VU}@example.com`,
        company: 'K6 Test Corp',
        role: 'Developer',
        useCase: 'Load testing the waitlist endpoint',
    });

    response = http.post(`${BASE_URL}/api/v1/waitlist`, payload, {
        headers: { 'Content-Type': 'application/json' },
    });

    check(response, {
        'waitlist API status is 200': (r) => r.status === 200,
        'waitlist API response time <1s': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(2);
}

// Setup function (runs once per VU)
export function setup() {
    const startTime = Date.now();
    console.log(`Load test started at ${new Date(startTime).toISOString()}`);
    return { startTime };
}

// Teardown function (runs once at the end)
export function teardown(data) {
    const duration = (Date.now() - data.startTime) / 1000;
    console.log(`Load test completed in ${duration} seconds`);
}
