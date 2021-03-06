function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child =>
                typeof child === 'object'
                    ? child : createTextElement(child)
            )
        }
    }
}

function createTextElement(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: []
        }
    }
}

function createDom(fiber) {
    const dom = fiber.type == 'TEXT_ELEMENT'
        ? document.createTextNode('')
        : document.createElement(fiber.type)


    const isProperty = key => key !== "children"

    Object.keys(fiber.props)
        .filter(isProperty)
        .forEach(name => {
            dom[name] = fiber.props[name]
        })

    return dom
}

function render(element, container) {
    console.log('element', element);
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    }
    deletions = []
    nextUnitOfWork = wipRoot
}

let wipRoot = null
let currentRoot = null
let nextUnitOfWork = null
let deletions = null

// special kind of prop lick event listeners
const isEvent = key => key.startsWith('on')
const isProperty = key => key !== "children" && isEvent(key)
const isNew = (prev, next) => key =>
    prev[key] !== next[key]
const isGone = (next) => key => !(key in next)
function uodateDom(fiber, prevProps, nextProps) {
    // remote old or changed event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
        .forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2)

            dom.removeEventListener(eventType, prevProps[name])
        })

    // Remove old properties
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(nextProps))
        .forEach(name => {
            dom[name] = ""
        })

    // Set new properties
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            dom[name] = nextProps[name]
        })

    // add event listeners
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(key => isNew(prevProps, nextProps)(key))
        .forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2)

            dom.addEventListener(eventType, nextProps[name])
        })

}
function commitRoot() {
    deletions.forEach(commitWork)
    commitWork(wipRoot.child)
    currentRoot = wipRoot
    wipRoot = null
}

function commitWork(fiber) {
    if (!fiber) {
        return
    }

    const domParentFiber = fiber.parent
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom

    if (
        fiber.effectTag === 'PLACEMENT' &&
        fiber.dom !== null
    ) {
        domParent.appendChild(fiber.dom)
    } else if (
        fiber.effectTag === 'UPDATE' &&
        fiber.dom !== null
    ) {
        uodateDom(
            fiber.dom,
            fiber.alternate.props,
            fiber.props
        )
    } else if (fiber.effectTag === 'DELETION') {
        commitDeletion(fiber, domParent)
    }

    commitWork(domParent.child)
    commitWork(domParent.sibling)
}

function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom)
    } else {
        // keep going util we find a child with dom node
        commitDeletion(fiber.child, domParent)
    }
}

function workLoop(deadline) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )

        shouldYield = deadline.timeRemaining() < 1
    }

    // once we finish all the work, we commit the whole fiber tree
    if (!nextUnitOfWork && wipRoot) {
        commitRoot()
    }
    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
    console.log('fiber', fiber);
    const isFunctionComponent =
        fiber.type instanceof Function

    if (isFunctionComponent) {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }


    // return next unit of work
    if (fiber.child) {
        return fiber.child
    }
    let nextFiber = fiber
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}

// global variable
let wipFiber = null
let hookIndex = null

function updateFunctionComponent(fiber) {
    wipFiber = fiber
    hookIndex = 0
    wipFiber.hooks = []

    const children = [fiber.type(fiber.props)]
    console.log('children in updateFunctionComponent', children)
    reconcileChildren(fiber, children)
}

/**
 * When the function component calls useState, we check if we have an old hook. We check in the alternate of the fiber using the hook index.
 * If we have an old hook, we copy the state from the old hook to the new hook, if we don???t we initialize the state.
 * Then we add the new hook to the fiber, increment the hook index by one, and return the state.
 * @param {number} initial 
 * @returns 
 */
// useState
function useState(initial) {
    const oldHook =
        wipFiber.alternate &&
        wipFiber.alternate.hooks &&
        wipFiber.alternate.hooks[hookIndex]

    const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: []
    }

    const actions = oldHook ? oldHook.queue : []
    actions.forEach(action => {
        hook.state = action(hook.state)
    })

    const setState = action => {
        hook.queue.push(action)

        /**
         * And then we do something similar to what we did in the render function,
         * set a new work in progress root as the next unit of work so the work loop can start a new render phase.
         */
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot,
        }
        nextUnitOfWork = wipRoot
        deletions = []
    }

    wipFiber.hooks.push(hook)
    hookIndex++
    return [hook.state, setState]
}

function updateHostComponent(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    reconcileChildren(fiber, fiber.props.children)
}

/**
 * The element is the thing we want to render to the DOM and the oldFiber is what we rendered the last time.
 * @param {*} wipFiber 
 * @param {*} elements 
 */
function reconcileChildren(wipFiber, elements) {
    let index = 0
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child
    let prevSibling = null

    while (index < elements.length || oldFiber != null) {
        const element = elements[index]
        let newFiber = null

        // const newFiber = {
        //     type: element.type,
        //     props: element.props,
        //     parent: fiber,
        //     dom: null
        // }

        // compare old fiber to element
        const sameType =
            oldFiber &&
            element &&
            element.type == oldFiber.type

        if (sameType) {
            // update the node
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: 'UPDATE'
            }
        }

        if (element && !sameType) {
            // create new fiber
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: 'PLACEMENT'
            }
        }

        if (oldFiber && !sameType) {
            // delete oldFiber
            oldFiber.effectTag = 'DELETETION'
            deletions.push(oldFiber)
        }

        if (index === 0) {
            wipFiber.child = newFiber
        } else {
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber
        index++
    }
}
const Chaos = {
    createElement,
    render,
    useState
}

export default Chaos