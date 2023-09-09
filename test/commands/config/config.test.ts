import { expect, test } from '@oclif/test';

describe('Create configuration file', () => {
  test
    .stdout()
    .command(['config init', '-d', '--skip'])
    .it('runs delete configuration file cmd', (ctx) => {
      expect(ctx.stdout).to.contain('Configuration file deleted');
    });

  test
    .stdout()
    .command(['config init', '-n=test', '-k=test', '-p=test', '--skip'])
    .it('runs config init cmd', (ctx) => {
      expect(ctx.stdout).to.contain('Configuration file created!');
    });

  test
    .stdout()
    .command(['config set', '-p', 'account=neftyblocks', '-k=test'])
    .it('runs config set cmd', (ctx) => {
      expect(ctx.stdout).to.contain('Update completed');
    });

  test
    .stdout()
    .command(['config get', '-p=account', '-k=test'])
    .it('runs config get cmd', (ctx) => {
      expect(ctx.stdout).to.contain('account: neftyblocks');
    });
});
