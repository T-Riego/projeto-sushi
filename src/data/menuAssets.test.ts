import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { menuItems } from './menu'

const publicDirectory = resolve(process.cwd(), 'public')
const minimumImageSize = 10 * 1024

describe('assets do cardápio', () => {
  it('usa um caminho de imagem único para cada um dos 24 produtos', () => {
    const imagePaths = menuItems.map(({ image }) => image)

    expect(menuItems).toHaveLength(24)
    expect(new Set(imagePaths).size).toBe(menuItems.length)
  })

  it('mantém todos os arquivos referenciados em public com mais de 10 KB', () => {
    const missingFiles: string[] = []
    const undersizedFiles: string[] = []

    for (const { image } of menuItems) {
      const imagePath = resolve(publicDirectory, image)
      if (!existsSync(imagePath)) {
        missingFiles.push(image)
        continue
      }

      if (statSync(imagePath).size <= minimumImageSize) {
        undersizedFiles.push(image)
      }
    }

    expect(missingFiles, 'arquivos de imagem ausentes').toEqual([])
    expect(undersizedFiles, 'arquivos de imagem com 10 KB ou menos').toEqual([])
  })

  it('declara nos créditos que as imagens gastronômicas foram geradas para AYORUME', () => {
    const credits = readFileSync(
      resolve(publicDirectory, 'creditos-fotograficos.html'),
      'utf8',
    )

    expect(credits).toContain(
      'Imagens gastronômicas geradas para o projeto AYORUME',
    )
  })
})
