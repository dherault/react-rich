import { useState } from 'react'
import RichTextEditor from 'react-rich'

function App() {
  const [content, setContent] = useState([
    {
      id: 0,
      type: 'paragraph',
      children: [
        {
          id: 1,
          type: 'text',
          text: 'Hello World!',
        },
      ],
    },
  ])

  return (
    <RichTextEditor
      content={content}
      setContent={setContent}
    />
  )
}

export default App
