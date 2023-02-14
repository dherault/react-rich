import { useState } from 'react'
import RichTextEditor from 'react-rich'

function App() {
  const [content, setContent] = useState([
    {
      id: '0',
      type: 'image',
      text: 'https://picsum.photos/200/300',
    },
    {
      id: '1',
      type: 'paragraph',
      children: [
        {
          id: '11',
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
