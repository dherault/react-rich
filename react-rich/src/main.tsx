import { Dispatch, ReactNode, SetStateAction, useCallback, useMemo, useRef } from 'react'
import { CompositeDecorator, ContentBlock, ContentState, Editor, EditorState, RichUtils } from 'draft-js'
import 'draft-js/dist/Draft.css'

import InlineMenu from './InlineMenu'

type RichTextEditorPropsType = {
  content: EditorState
  setContent: Dispatch<SetStateAction<EditorState>>
}

function RichTextEditor({ content, setContent }: RichTextEditorPropsType) {
  const editorRef = useRef<Editor>(null)

  const textSelected = useMemo(() => {
    const selectionState = content.getSelection()

    const start = selectionState.getStartOffset()
    const end = selectionState.getEndOffset()

    return start !== end
  }, [content])

  const handleKeyCommand = useCallback((command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command)

    if (newState) {
      setContent(newState)

      return 'handled'
    }

    return 'not-handled'
  }, [setContent])

  const handleRichClick = useCallback((command: string) => {
    setContent(x => RichUtils.toggleInlineStyle(x, command))
  }, [setContent])

  const insertLink = useCallback((url: string) => {
    setContent(x => {
      const contentState = x.getCurrentContent()
      const contentStateWithEntity = contentState.createEntity(
        'LINK',
        'MUTABLE',
        { url }
      )
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
      const newEditorState = EditorState.set(x, { currentContent: contentStateWithEntity })

      return RichUtils.toggleLink(
        newEditorState,
        newEditorState.getSelection(),
        entityKey
      )
    })
  }, [setContent])

  return (
    <>
      <button
        type="button"
        onClick={() => handleRichClick('BOLD')}
      >
        Bold
      </button>
      <button
        type="button"
        onClick={() => insertLink('https://herobusinessplan.com')}
      >
        Link to herobusinessplan.com
      </button>
      <div style={{ position: 'relative' }}>
        <Editor
          ref={editorRef}
          editorState={content}
          onChange={setContent}
          handleKeyCommand={handleKeyCommand}
        />
        <InlineMenu
          open={textSelected}
          content={content}
          setContent={setContent}
          editor={editorRef.current}
        />
      </div>
    </>
  )
}

export default RichTextEditor

function findLinkEntities(contentBlock: ContentBlock, callback: (start: number, end: number) => void, contentState: ContentState) {
  contentBlock.findEntityRanges(
    character => {
      const entityKey = character.getEntity()

      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'LINK'
      )
    },
    callback
  )
}

type LinkPropsType = {
  contentState: ContentState
  entityKey: string
  children: ReactNode
}

function Link({ contentState, entityKey, children }: LinkPropsType) {
  const { url } = contentState.getEntity(entityKey).getData()

  return (
    <a href={url}>
      {children}
    </a>
  )
}

const decorator = new CompositeDecorator([
  {
    strategy: findLinkEntities,
    component: Link,
  },
])

export const createEmptyState = () => EditorState.createEmpty(decorator)
