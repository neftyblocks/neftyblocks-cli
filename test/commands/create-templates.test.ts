import { expect, test } from '@oclif/test';

describe('create-templates', () => {
  test
    .stdout()
    .command(['create-templates', '-c=1', '-s=1', '-f=test.xls', '-k=test'])
    .it('runs create-templates without valid xls', (ctx) => {
      expect(ctx.stdout).to.contain('Error: XLS file not found');
    });
});
