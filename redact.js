const redactedStrings = ["luke", "bennett", "stacki"];

const redaction = "░";

let redactedCount = 0;
let totalTextNodeCount = 0;

const getRootTargets = ()=>[$0, document, document.querySelector('nextjs-portal')?.shadowRoot].filter(Boolean)

const findAllElements = (target)=>target.querySelectorAll('*')

const findAllRootElements = ()=>{
    const rootTargets = getRootTargets();

    return rootTargets.reduce((all,target)=>{
        const found = findAllElements(target);

        [...found].reduce((result,element)=>{
            result.add(element);
            return result
        }
        , all)

        return all
    }
    , new Set())
}

const redact = (node,str)=>{
    const reg = new RegExp(str,"gi");
    if (reg.test(node.textContent)) {
        redactedCount++;
        node.textContent = node.textContent.replace(reg, new Array(str.length).fill(redaction).join(""), );
    }
}

const redactElement = async(element)=>{
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node = walker.currentNode;

        totalTextNodeCount++;

        if (!node.textContent || node.textContent.replace(/\s/g, "").length <= 0) {
            continue;
        }

        redactedStrings.forEach((str)=>{
            redact(node, str);

        }
        );
    }

}

const isGoodTarget = (element)=>!(element instanceof HTMLStyleElement || element instanceof HTMLScriptElement || element instanceof HTMLHtmlElement)

const redactAll = (elements)=>{
    return [...elements].reduce((proms,element)=>{
        if (isGoodTarget(element))
            return proms;

        return [...proms, redactElement(element)]
    }
    , []);
}

const measurePerf = async(action)=>{
    let result = null;

    const start = performance.now();
    let end = Infinity;

    try {
        result = await action()
    } catch (error) {
        console.error(error);
    } finally {
        end = performance.now()
    }

    const duration = end - start;

    console.log('duration', end, start, duration, duration / 1000)

    return {
        result,
        start,
        end,
        duration,
        durationSeconds: duration / 1000
    }
}

const main = async()=>{
    const allElements = findAllRootElements();

    console.log(`Checking redaction of ${allElements.length} root elements.`);

    const redactions = redactAll(allElements);

    console.info(`Waiting for ${redactions.length} filtered results...`);

    const {durationSeconds} = await measurePerf(()=>Promise.allSettled(redactions))

    console.info(`Redacted ${redactedCount} text nodes.`);
    console.info(`Skipped ${totalTextNodeCount - redactedCount} text nodes.`);
    console.info(`Took ${durationSeconds}s.`)
}

console.clear();
main()
