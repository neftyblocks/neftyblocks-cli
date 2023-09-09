import { expect, test } from '@oclif/test';

describe('mint-assets', () => {
  test
    .stdout()
    .command(['mint-assets'])
    .it('runs hello', (ctx) => {
      expect(ctx.stdout).to.contain('hello world');
    });

  test
    .stdout()
    .command(['mint-assets', '--name', 'jeff'])
    .it('runs hello --name jeff', (ctx) => {
      expect(ctx.stdout).to.contain('hello jeff');
    });
});
