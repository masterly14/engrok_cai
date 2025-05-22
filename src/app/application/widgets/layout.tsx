import CreateWidgetDialog from '@/components/application/widget/create-widget-dialog'
import React from 'react'

type Props = {
    children: React.ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">Widgets</h1>
          <div className="flex justify-end">
            <CreateWidgetDialog />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  )
}

export default Layout