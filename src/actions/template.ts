'use server'

import { db } from "@/utils"

export async function getTemplates() {
    try {
      const templates = await db.template.findMany()
      return templates
    } catch (error) {
      throw new Error('Failed to fetch templates')
    }
  }

  