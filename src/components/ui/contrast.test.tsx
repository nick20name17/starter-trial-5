import axe from 'axe-core'
import { expect, onTestFinished, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Button } from '@/components/ui/button'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'

import '@/index.css'

const variants = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const

async function lowContrastText(element: Element) {
  // Hover colors fade in, and axe would read a color halfway
  await Promise.all(document.getAnimations().map((animation) => animation.finished))
  const { violations } = await axe.run(element, { runOnly: ['color-contrast'], elementRef: true })
  return violations.flatMap((violation) => violation.nodes.map((node) => node.element?.textContent))
}

// e2e runs axe wherever the cursor rests: on the button just clicked, or on the row under it
test.each(['light', 'dark'])(
  'text has enough contrast at rest and under the cursor in the %s theme',
  async (theme) => {
    document.documentElement.classList.add(theme)
    onTestFinished(() => document.documentElement.classList.remove(theme))
    const screen = await render(
      <>
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
        {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- Item renders its children in the link */}
        <Item variant='outline' render={<a href='#item' />}>
          <ItemContent>
            <ItemTitle>Item title</ItemTitle>
            <ItemDescription>Item description</ItemDescription>
          </ItemContent>
        </Item>
      </>,
    )
    const lowContrast = await lowContrastText(screen.container)

    for (const element of [...screen.getByRole('button').all(), screen.getByRole('link')]) {
      await element.hover()
      const texts = await lowContrastText(screen.container)
      lowContrast.push(...texts.map((text) => `${text} under the cursor`))
    }

    expect(lowContrast).toEqual([])
  },
)
