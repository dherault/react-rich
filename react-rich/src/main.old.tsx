import { Dispatch, FormEvent, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type MenuQueryType = {
  x: number
  y: number
  query: string
}

type MenuItemType = {
  label: string
}

type RichTextNodeTypesType = 'paragraph' | 'text' | 'image' | 'table'

type RichTextNodeType = {
  id: string
  type: RichTextNodeTypesType
  children?: RichTextNodeType[]
  html?: string
}

type RichTextContentType = RichTextNodeType[]

type RichTextEditorPropsType = {
  content: RichTextContentType
  setContent: Dispatch<SetStateAction<RichTextContentType>>
}

const menuDelimiter = '/'
const menuOffset = {
  x: 8,
  y: 8,
}

const menuItems: Partial<Record<RichTextNodeTypesType, MenuItemType>> = {
  paragraph: {
    label: 'Paragraph',
  },
  image: {
    label: 'Image',
  },
  table: {
    label: 'Table',
  },
}

const typeToRenderer: Partial<Record<RichTextNodeTypesType, (node: RichTextNodeType) => string>> = {
  paragraph: (node: RichTextNodeType) => `<p id="${node.id}">${node.children?.map(child => `<span id="${child.id}">${child.html}</span>`).join('')}</p>`,
  image: (node: RichTextNodeType) => `<img id="${node.id}" width="10%" src="${node.html}" />`,
}

function renderContentToHtml(content: RichTextContentType) {
  if (!Array.isArray(content)) return ''

  return content.map(node => typeToRenderer[node.type]?.(node)).join('')
}

function RichTextEditor({ content, setContent }: RichTextEditorPropsType) {
  const rootRef = useRef<HTMLDivElement>(null)

  console.log('content', content)
  const [currentNode, setCurrentNode] = useState<RichTextNodeType | null>(null)
  const [currentNodeIndex, setCurrentNodeIndex] = useState<number>(-1)
  const [menuQuery, setMenuQuery] = useState<MenuQueryType | null>(null)

  const getContentText = useCallback(() => content.map(node => node.children?.map(child => child.html ?? '')).join(''), [content])

  const getContentTree = useCallback((htmlString: string) => {

    console.log('htmlString', htmlString)
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlString, 'text/html')
    const root = doc.body
    const children = root.childNodes
    const result: RichTextNodeType[] = []
    const ids: string[] = []

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as Element

      if (child.nodeName === 'P') {
        const textNodes = child.childNodes
        const textChildren: RichTextNodeType[] = []

        for (let j = 0; j < textNodes.length; j++) {
          const textNode = textNodes[j] as Element

          if (textNode.nodeName === 'SPAN') {
            const id = ids.includes(textNode.id) ? Math.random().toString() : textNode.id ?? Math.random().toString()

            ids.push(id)
            textChildren.push({
              id,
              type: 'text',
              html: textNode.innerHTML,
            })
          }
        }

        const id = ids.includes(child.id) ? Math.random().toString() : child.id ?? Math.random().toString()

        ids.push(id)
        result.push({
          id,
          type: 'paragraph',
          children: textChildren,
        })
      }
      else if (child.nodeName === 'IMG') {
        const id = ids.includes(child.id) ? Math.random().toString() : child.id ?? Math.random().toString()

        ids.push(id)
        result.push({
          id,
          type: 'image',
          html: child.getAttribute('src') ?? '',
        })
      }
    }

    return result
  }, [])

  const handleInput = useCallback((event: FormEvent<HTMLDivElement>) => {
    const existingText = getContentText()
    const rawText = event.currentTarget.innerText
    const nDiff = rawText.length - existingText.length

    const tree = getContentTree(event.currentTarget.innerHTML)

    console.log('tree', tree)

    rootRef.current!.innerHTML = renderContentToHtml(tree)

    setContent(tree)

    if (nDiff > 0) {
      const caretIndex = getCaretIndex(rootRef.current!)

      const newText = rawText.slice(caretIndex - nDiff, caretIndex)

      console.log('newText', newText)

      if (newText === menuDelimiter) {
        const { x, y } = getCaretCoordinates(rootRef.current!)

        console.log('x, y', x, y)

        setMenuQuery({
          x: x + menuOffset.x,
          y: y + menuOffset.y,
          query: '',
        })

        return
      }

      return
    }

    setMenuQuery(null)
  }, [getContentText, getContentTree, setContent])

  const handleAddNode = useCallback((key: RichTextNodeTypesType) => {
    setContent(prevContent =>
      // TODO
      [...prevContent, { type: key, id: Math.random().toString() }]
    )
    setMenuQuery(null)
  }, [setContent])

  const handleCaretChange = useCallback(() => {

  }, [])

  useEffect(() => {
    if (!rootRef.current) return

    const { current } = rootRef

    current.addEventListener('click', handleCaretChange)
    current.addEventListener('keydown', handleCaretChange)

    return () => {
      current.removeEventListener('click', handleCaretChange)
      current.removeEventListener('keydown', handleCaretChange)
    }
  }, [handleCaretChange])

  useEffect(() => {
    if (!rootRef.current) return

    rootRef.current.innerHTML = renderContentToHtml(content)
  }, [content])

  return (
    <>
      <div>
        {JSON.stringify(currentNode?.id)}
        {' - '}
        {currentNodeIndex}
      </div>
      <div style={{ position: 'relative' }}>
        <div
          ref={rootRef}
          contentEditable
          suppressContentEditableWarning
          // dangerouslySetInnerHTML={{ __html: renderContentToHtml(content) }}
          onInput={handleInput}
          style={{
            outline: 'none',
            backgroundColor: '#eee',
          }}
        />
        <RichTextEditorMenu
          menuQuery={menuQuery}
          setMenuQuery={setMenuQuery}
          onValidate={handleAddNode}
        />
      </div>
    </>
  )
}

function getCaretCoordinates(element: HTMLDivElement) {
  const { top, left } = element.getBoundingClientRect()

  let x = -left
  let y = -top
  const isSupported = typeof window.getSelection !== 'undefined'

  if (!isSupported) return { x, y }

  const selection = window.getSelection()

  if (!(selection && selection.rangeCount !== 0)) return { x, y }

  const range = selection.getRangeAt(0).cloneRange()
  range.collapse(true)
  const rect = range.getClientRects()[0]

  if (rect) {
    x += rect.left
    y += rect.top
  }

  return { x, y }
}

function getCaretIndex(element: HTMLDivElement) {
  let position = 0
  const isSupported = typeof window.getSelection !== 'undefined'

  if (!isSupported) return position

  const selection = window.getSelection()
    // Check if there is a selection (i.e. cursor in place)
  if (!(selection && selection.rangeCount !== 0)) return position
      // Store the original range
  const range = selection.getRangeAt(0)
      // Clone the range
  const preCaretRange = range.cloneRange()
      // Select all textual contents from the contenteditable element
  preCaretRange.selectNodeContents(element)
      // And set the range end to the original clicked position
  preCaretRange.setEnd(range.endContainer, range.endOffset)
      // Return the text length from contenteditable start to the range end
  position = preCaretRange.toString().length

  return position
}

type RichTextEditorMenuPropsType = {
  menuQuery: MenuQueryType | null
  setMenuQuery: Dispatch<SetStateAction<MenuQueryType | null>>
  onValidate: (key: RichTextNodeTypesType) => void
}

function RichTextEditorMenu({ menuQuery, setMenuQuery, onValidate }: RichTextEditorMenuPropsType) {
  const [selectedKey, setSelectedKey] = useState('')

  const filteredMenuItems = useMemo(() => {
    if (!menuQuery?.query) return menuItems

    return Object.entries(menuItems)
      .filter(([key]) => key.includes(menuQuery?.query ?? ''))
      .map(([key, value]) => ({ key, value }))
      .reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as typeof menuItems)
  }, [menuQuery])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setMenuQuery(null)

      return
    }

    if (event.key === 'Enter') {
      onValidate(selectedKey as RichTextNodeTypesType)
      setSelectedKey('')

      return
    }

    if (event.key === 'ArrowUp') {
      const keys = Object.keys(filteredMenuItems)

      const index = keys.indexOf(selectedKey)

      setSelectedKey(keys[index - 1] ?? keys[keys.length - 1])

      return
    }

    if (event.key === 'ArrowDown') {
      const keys = Object.keys(filteredMenuItems)

      const index = keys.indexOf(selectedKey)

      setSelectedKey(keys[index + 1] ?? keys[0])
    }
  }, [selectedKey, filteredMenuItems, setMenuQuery, onValidate])

  useEffect(() => {
    const keys = Object.keys(filteredMenuItems)

    if (keys.includes(selectedKey)) return

    setSelectedKey(keys[0])
  }, [selectedKey, filteredMenuItems])

  useEffect(() => {
    if (!menuQuery) return

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuQuery, handleKeyDown])

  if (!menuQuery) return null

  return (
    <div
      style={{
        position: 'absolute',
        backgroundColor: '#ddd',
        color: 'white',
        left: menuQuery.x,
        top: menuQuery.y,
      }}
    >
      {Object.entries(filteredMenuItems).map(([key, value]) => (
        <div
          key={key}
          style={{
            color: key === selectedKey ? 'blue' : 'white',
          }}
        >
          {value.label}

        </div>
      ))}
    </div>
  )
}

export default RichTextEditor
