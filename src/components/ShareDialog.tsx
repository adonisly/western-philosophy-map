// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'

export function ShareDialog({ title, url, onClose }: { title: string; url: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')
  useEffect(() => {
    const element = dialog.current!
    if (!element.open) element.showModal()
  }, [])
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setStatus('链接已复制，可以发给读书伙伴了。')
    } catch {
      input.current?.focus(); input.current?.select()
      setStatus('未能自动复制，请长按或使用 Ctrl/Cmd+C 复制上方链接。')
    }
  }
  return <dialog ref={dialog} onClose={onClose} aria-labelledby="share-title" aria-describedby="share-description"
    className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-2xl backdrop:bg-black/40"
    onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <h2 id="share-title" className="text-lg font-bold pr-6">{title}</h2>
    <p id="share-description" className="mt-2 text-sm text-gray-600">打开链接即可恢复人物、布局、搜索与筛选。拖动位置和缩放不包含在链接中。</p>
    <label htmlFor="share-url" className="block mt-4 mb-1 text-sm font-medium">分享链接</label>
    <input ref={input} id="share-url" autoFocus readOnly value={url} onFocus={event => event.target.select()}
      className="w-full min-w-0 rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
    <p role="status" className="mt-2 min-h-10 text-sm text-blue-700">{status}</p>
    <div className="mt-3 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>关闭</Button><Button onClick={copy}>复制链接</Button></div>
  </dialog>
}
