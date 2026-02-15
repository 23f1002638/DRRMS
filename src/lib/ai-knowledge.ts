import { User } from '../components/AuthSystem';

export interface AIResponse {
    text: string;
    action?: {
        type: 'navigate' | 'call' | 'link';
        value: string;
        label: string;
    };
}

interface Intent {
    id: string;
    keywords: string[];
    context?: string[]; // Only match if user is in this activeView
    role?: string[];    // Only match if user has this role
    response: (user: User | null, view: string) => AIResponse;
}

export const knowledgeBase: Intent[] = [
    // GLOBAL INTENTS
    {
        id: 'greeting',
        keywords: ['hello', 'hi', 'hey', 'start', 'help'],
        response: (user) => ({
            text: `Hello ${user?.name || 'there'}! I'm your DRRMS Assistant. I can help you find resources, manage tasks, or navigate the portal. What do you need help with?`
        })
    },
    {
        id: 'emergency',
        keywords: ['emergency', 'danger', 'hurt', 'dying', '911', 'help me', 'urgent'],
        response: () => ({
            text: "If this is a life-threatening emergency, please call 911 immediately.",
            action: {
                type: 'call',
                value: '911',
                label: 'Call 911'
            }
        })
    },

    // VIEW SPECIFIC: RESOURCES
    {
        id: 'find_shelter',
        keywords: ['shelter', 'housing', 'sleep', 'stay'],
        context: ['resources', 'dashboard', 'map'],
        response: () => ({
            text: "I can help you find emergency shelters. You can view them on the map or in the resources list.",
            action: {
                type: 'navigate',
                value: 'resources',
                label: 'View Shelters'
            }
        })
    },

    // FEATURE: SUPPORT GROUPS
    {
        id: 'support_groups',
        keywords: ['support group', 'therapy', 'counseling', 'talk', 'alone', 'grief'],
        response: () => ({
            text: "We have support groups available for grief, trauma, and family support. You can join them to connect with others.",
            action: {
                type: 'navigate',
                value: 'support',
                label: 'Find Support Groups'
            }
        })
    },

    // FEATURE: DONATIONS
    {
        id: 'donate',
        keywords: ['donate', 'give', 'money', 'supplies', 'contribution'],
        response: () => ({
            text: "Your contributions make a huge difference! You can donate money, supplies, or services directly through the Donor Portal.",
            action: {
                type: 'navigate',
                value: 'donor', // Logic might need to check if user is donor or needs to switch
                label: 'Go to Donation Page'
            }
        })
    }
];

export function findBestMatch(input: string, context: string, user: User | null): AIResponse {
    const lowerInput = input.toLowerCase();

    // 1. Filter by Context/Role validity
    const candidates = knowledgeBase.filter(intent => {
        if (intent.context && !intent.context.includes(context)) return false; // Strict context? Maybe loose is better
        if (intent.role && user && !intent.role.includes(user.role)) return false;
        return true;
    });

    // 2. Score by keyword matching
    let bestMatch: Intent | null = null;
    let maxScore = 0;

    // Search ALL intents (even out of context, but prioritize in-context)
    for (const intent of knowledgeBase) {
        let score = 0;
        for (const keyword of intent.keywords) {
            if (lowerInput.includes(keyword)) score += 1;
        }

        // Boost score if context matches
        if (intent.context && intent.context.includes(context)) {
            score += 2;
        }

        if (score > maxScore) {
            maxScore = score;
            bestMatch = intent;
        }
    }

    if (bestMatch && maxScore > 0) {
        return bestMatch.response(user, context);
    }

    return {
        text: "I'm not sure I understand. Could you rephrase that? I can help with finding resources, donations, emergency contacts, and volunteering."
    };
}
