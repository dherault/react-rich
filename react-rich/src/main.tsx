import { Dispatch, FormEvent, SetStateAction, useCallback, useMemo, useRef, useState } from 'react'

type MenuQueryType = {
  x: number
  y: number
  query: string
}

type RichTextNodeTypesType = 'paragraph' | 'text'

type RichTextNodeType = {
  id: string
  type: RichTextNodeTypesType
  children?: RichTextNodeType[]
  text?: string
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

function RichTextEditor({ content, setContent }: RichTextEditorPropsType) {
  const rootRef = useRef<HTMLDivElement>(null)

  const [menuQuery, setMenuQuery] = useState<MenuQueryType | null>(null)

  const renderParagraph = useCallback((node: RichTextNodeType) => (
    <p key={node.id}>
      {node.children?.map(child => (
        <span key={child.id}>{child.text}</span>
      ))}
    </p>
  ), [])

  const typeToRenderer = useMemo<Partial<Record<RichTextNodeTypesType, typeof renderParagraph>>>(() => ({
    paragraph: renderParagraph,
  }), [renderParagraph])

  const renderContent = useCallback((content: RichTextContentType) => {
    if (!Array.isArray(content)) return null

    return content.map(node => typeToRenderer[node.type]?.(node))
  }, [typeToRenderer])

  const getContentText = useCallback(() => content.map(node => node.children?.map(child => child.text ?? '')).join(''), [content])

  const handleInput = useCallback((event: FormEvent<HTMLDivElement>) => {
    const existingText = getContentText()
    const rawText = event.currentTarget.innerText

    console.log('existingText, ', existingText, rawText)
    const nDiff = rawText.length - existingText.length

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
      }
    }
  }, [getContentText])

  const renderMenu = useCallback(() => {
    if (menuQuery === null) return null

    return (
      <div style={{
        position: 'absolute',
        backgroundColor: 'red',
        color: 'white',
        left: menuQuery.x,
        top: menuQuery.y,
      }}
      >
        Foo
      </div>
    )
  }, [menuQuery])

  return (
    <div
      ref={rootRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      style={{
        position: 'relative',
        outline: 'none',
        backgroundColor: '#eee',
      }}
    >
      {renderContent(content)}
      {renderMenu()}
    </div>
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

export default RichTextEditor
