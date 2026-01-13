/**
 * AuNouri - Onboarding Index
 * Entry point that redirects to step 1
 */

import { Redirect } from 'expo-router';

export default function OnboardingIndex() {
    return <Redirect href="/onboarding/step1-basics" />;
}
