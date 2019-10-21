const { execSync } = require('child_process');
const fs = require('fs');

// Get latest tag version
const latestTag = execSync(`git describe --long`).toString('utf-8').split('-')[0];
console.log('latest tag', latestTag);
const output = execSync(`git log ${latestTag}..HEAD --format=%B%H----DELIMITER----`).toString('utf-8');

// adding delimiter string to help us to splut the string
// filtered the commit if it doesn't have SHA hash
const commitsArray = output.split('----DELIMITER----\n').map(commit => {
  const [message, sha] = commit.split('\n');

  return { sha, message };
}).filter(commit => Boolean(commit.sha));

console.log({ commitsArray });

const currentChangelog = fs.readFileSync('./CHANGELOG.md', 'utf-8');
const currentVersion = Number(require('./package.json').version);
const newVersion = currentVersion + 1;

let newChangelog = `# Version ${newVersion} (${
  new Date().toISOString().split('T')[0]
})\n\n`;

const features = [];
const chores = [];

commitsArray.forEach(commit => {
  if (commit.message.startsWith('feature: ')) {
    features.push(
      `* ${commit.message.replace('feature: ', '')} ([${commit.sha.substring(
        0,
        6
      )}](https://github.com/DNikolova93/changelog-generator/commit/${
        commit.sha
      }))\n`
    );
  }

  if (commit.message.startsWith('chore: ')) {
    chores.push(
      `* ${commit.message.replace('chore: ', '')} ([${commit.sha.substring(
        0,
        6
      )}](https://github.com/DNikolova93/changelog-generator/commit/${
        commit.sha
      }))\n`
    );
  }
});

if (features.length) {
  newChangelog += `## Features\n`;
  features.forEach(feature => {
    newChangelog += feature;
  });

  newChangelog += `\n`;
}

if (chores.length) {
  newChangelog += `## Chores\n`;
  chores.forEach(feature => {
    newChangelog += feature;
  });

  newChangelog += `\n`;
}
// prepend newChangelog to the current one
fs.writeFileSync('./CHANGELOG.md', `${newChangelog}${currentChangelog}`);

// update package.json
fs.writeFileSync('./package.json', JSON.stringify({ version: String(newVersion) }, null, 2));

// create new commit
execSync('git add .');
execSync(`git commit -m "chore: Bump to version ${newVersion}"`);

// tag to commit
execSync(`git tag -a -m "Tag for version ${newVersion} version${newVersion}`);
