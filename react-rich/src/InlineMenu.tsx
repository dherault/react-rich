import { Dispatch, SetStateAction } from 'react'
import { Editor, EditorState, getVisibleSelectionRect } from 'draft-js'

type InlineMenuPropsType = {
  open: boolean
  content: EditorState
  setContent: Dispatch<SetStateAction<EditorState>>
  editor: Editor
}

function InlineMenu({ open, content, setContent, editor }: InlineMenuPropsType) {
  if (!open) return null

  const selectionRect = getVisibleSelectionRect(window)

  if (!selectionRect) return null

  const editorRect = editor.editor?.getBoundingClientRect()

  if (!editorRect) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: selectionRect.top - editorRect.top - selectionRect.height,
        left: selectionRect.left - editorRect.left,
        backgroundColor: '#eee',
      }}
    >
      Foo
    </div>
  )
}

export default InlineMenu
