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
        const SEP = '||__SEP__||'
        const logs = execSync(
          `git log ${range} --format="%H\n%h\n%s\n%b"`
        )
          .toString()
          .trim()

        if (!logs) return

        const parsed = logs
          .split('\n')
          .filter(Boolean)
          .map((entry) => {
            const [hash, shortHash, subject] = entry.split('\n')
            const body = entry.split('\n').slice(2).join('\n')
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

