import { useState } from 'react'
import RichTextEditor, { createEmptyState } from 'react-rich'

function App() {
  const [content, setContent] = useState(createEmptyState())

  return (
    <RichTextEditor
      content={content}
      setContent={setContent}
    />
  )
}

export default App
