// deploy.ts
import { execSync } from 'child_process'
import * as readline from 'readline'

interface CommitInfo {
  hash: string
  shortHash: string
  subject: string
  body: string
}

async function getPushCommits(): Promise<CommitInfo[]> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: process.stdin })
    const commits: CommitInfo[] = []

    rl.on('line', (line) => {
      const parts = line.trim().split(' ')
      if (parts.length < 4) return

      const [, localSha, , remoteSha] = parts
      const isNewBranch = remoteSha === '0000000000000000000000000000000000000000'
      const range = isNewBranch ? localSha : `${remoteSha}..${localSha}`

      try {
        const logs = execSync(
          `git log ${range} --format="%H%x1f%h%x1f%s%x1f%b%x1e"`
        )
          .toString()
          .trim()

        if (!logs) return

        const parsed = logs
          .split('\x1e')
          .filter(Boolean)
          .map((entry) => {
            const [hash, shortHash, subject, body] = entry.trim().split('\x1f')

            return {
              hash,
              shortHash,
              subject,
              body,
            }
          })

        commits.push(...parsed)
      } catch (err) {
        reject(err)
      }
    })

    rl.on('close', () => resolve(commits))
    rl.on('error', reject)
  })
}

// 使用
const commits = await getPushCommits()

console.log(commits);

