export function determineIntent(inputType: string, text: string): { isTopic: boolean; deepResearch: boolean } {
    let isTopic = inputType === 'topic';
    let deepResearch = false;

    if (inputType === 'text' && text.length < 500) {
        isTopic = true;
        deepResearch = true;
    }

    return { isTopic, deepResearch };
}
