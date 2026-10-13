export function traverseAndCheck(element: Element, condition: (element: Element) => boolean) {
    if (condition(element)) return true;
    return Array.from(element.children).some(child => traverseAndCheck(child, condition));
}

const nextAnimationFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export async function traverseAndCheckAsync(
    element: Element,
    condition: (element: Element) => boolean,
    frameBudgetMs = 4,
) {
    const pending = [element];
    let frameStartedAt = performance.now();

    while (pending.length) {
        const current = pending.pop();
        if (!current) continue;
        if (condition(current)) return true;
        pending.push(...Array.from(current.children));

        if (performance.now() - frameStartedAt >= frameBudgetMs) {
            await nextAnimationFrame();
            frameStartedAt = performance.now();
        }
    }
    return false;
}


// export function getAdjacentCellDiv(element, direction) {
//     let currentElement = element.closest('div[data-testid="cellInnerDiv"]');
//     while (currentElement) {
//         currentElement = direction === 'next' ? currentElement.nextElementSibling : currentElement.previousElementSibling;
//         if (!currentElement) break;
//         if (currentElement && currentElement.getAttribute('data-testid') === 'cellInnerDiv') {
//             return currentElement;
//         }
//     }
//     return null;
// }

export function getAdjacentCellDiv(element: Element, direction: 'next' | 'previous') {
    const sibling = direction === 'next' ? 'nextElementSibling' : 'previousElementSibling';
    let current: Element | null = element.closest('div[data-testid="cellInnerDiv"]');
    while (current && (current = current[sibling])) {
        if (current.getAttribute('data-testid') === 'cellInnerDiv') return current;
    }
    return null;
}



export function checkAppliedStyle(element: Element, properties: Array<[string, string]>) {
    const foundProperties = new Set<string>();

    for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try {
            rules = sheet.cssRules;
        } catch {
            continue;
        }
        for (const rule of Array.from(rules)) {
            if (rule instanceof CSSStyleRule && element.matches(rule.selectorText)) {
                for (let [prop, value] of properties) {
                    if (rule.style.getPropertyValue(prop) === value) {
                        foundProperties.add(prop);
                    }
                }
            }
        }
    }

    return foundProperties.size === properties.length;
}
