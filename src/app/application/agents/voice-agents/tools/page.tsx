"use client"

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'

const page = () => {
  return (
    <div className='flex flex-col gap-4 p-4'>
    <Card className=''>
        <CardHeader>
            <CardTitle>Tools</CardTitle>
        </CardHeader>
    </Card>
    </div>
  )
}

export default page
