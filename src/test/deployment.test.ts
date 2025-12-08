import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'

describe('Deployment', () => {
  it('gh-pages branch has correct asset files', async () => {
    // Fetch latest gh-pages
    execSync('git fetch origin gh-pages', { cwd: process.cwd(), stdio: 'pipe' })

    // Get index.html from gh-pages
    const ghPagesIndex = execSync('git show origin/gh-pages:index.html', {
      cwd: process.cwd(),
      encoding: 'utf-8'
    })

    // Extract asset references
    const jsMatch = ghPagesIndex.match(/src="\/pharma-ip-damages-model\/assets\/(index-[^"]+\.js)"/)
    const cssMatch = ghPagesIndex.match(/href="\/pharma-ip-damages-model\/assets\/(index-[^"]+\.css)"/)

    expect(jsMatch).not.toBeNull()
    expect(cssMatch).not.toBeNull()

    const jsFile = jsMatch![1]
    const cssFile = cssMatch![1]

    // Verify those files exist in gh-pages branch
    const ghPagesFiles = execSync('git ls-tree -r --name-only origin/gh-pages', {
      cwd: process.cwd(),
      encoding: 'utf-8'
    })

    expect(ghPagesFiles).toContain(`assets/${jsFile}`)
    expect(ghPagesFiles).toContain(`assets/${cssFile}`)
  })
})
