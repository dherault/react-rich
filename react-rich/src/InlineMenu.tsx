import { Dispatch, MouseEvent, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Editor, EditorState, getVisibleSelectionRect } from 'draft-js'
import Select from 'react-select'

type InlineMenuPropsType = {
  content: EditorState
  setContent: Dispatch<SetStateAction<EditorState>>
  editor: Editor
}

type PositionType = {
  top: number
  left: number
}

const selectOptions = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'header1', label: 'Header 1' },
  { value: 'header2', label: 'Header 2' },
  { value: 'header3', label: 'Header 3' },
]

function InlineMenu({ content, setContent, editor }: InlineMenuPropsType) {
  const rootRef = useRef<HTMLDivElement>(null)

  const [position, setPosition] = useState<PositionType | null>(null)

  const handleMenuClick = useCallback(() => {
    editor.focus()
  }, [editor])

  const handleMenuMouseDown = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  useEffect(() => {
    const selectionState = content.getSelection()
    const start = selectionState.getStartOffset()
    const end = selectionState.getEndOffset()
    const textSelected = start !== end

    if (!textSelected) return setPosition(null)

    const selectionRect = getVisibleSelectionRect(window)

    const editorRect = editor?.editor?.getBoundingClientRect()
    const height = rootRef.current?.getBoundingClientRect().height ?? 0

    if (!(selectionRect && editorRect)) return setPosition(null)

    const top = selectionRect.top - editorRect.top - selectionRect.height - height - 2 * 8 - 4
    const left = selectionRect.left - editorRect.left

    setPosition({ top, left })
  }, [content, editor?.editor])

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        display: position ? 'flex' : 'none',
        top: position?.top,
        left: position?.left,
        backgroundColor: 'white',
        padding: 8,
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        boxShadow: '0px 1.833px 2.580px -1.166px rgba(0,0,0,0.2), 0px 4px 6.332px 0.500px rgba(0,0,0,0.14), 0px 1.500px 7.664px 1.333px rgba(0,0,0,0.12)',
        userSelect: 'none',
      }}
      onClick={handleMenuClick}
      onMouseDown={handleMenuMouseDown}
    >
      <Select options={selectOptions} />
    </div>
  )
}

export default InlineMenu
