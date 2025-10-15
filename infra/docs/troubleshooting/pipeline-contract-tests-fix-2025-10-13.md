# Pipeline Contract Tests Fix - 2025-10-13

## Summary

**✅ Issue Resolved:**
GitHub Actions workflow "Deploy Infrastructure" was failing with `ModuleNotFoundError: No module named 'cdk'` when running contract tests.

**Root Cause:**
Incorrect `PYTHONPATH` environment variable in `.github/workflows/deploy.yml`. The workflow was using `PYTHONPATH=.` but the tests import from `cdk.stacks` which is located in `infra/cdk`.

**Fix Applied:**
Changed `PYTHONPATH=.` to `PYTHONPATH=infra` in the workflow file.

**⚠️ Additional Finding:**
GitHub Actions workflows do **not run automatically** when a Pull Request has **merge conflicts** with the target branch. The merge conflicts must be resolved before workflows will trigger.

## Detailed Findings

### Error Encountered

```
Run PYTHONPATH=. pytest infra/tests/contract/ -v
============================= test session starts ==============================
collecting ... collected 0 items / 12 errors

==================================== ERRORS ====================================
________ ERROR collecting infra/tests/contract/test_alb_dns_contract.py ________
ImportError while importing test module
infra/tests/contract/test_alb_dns_contract.py:4: in <module>
    from cdk.stacks.network_stack import NetworkStack
E   ModuleNotFoundError: No module named 'cdk'
```

All 12 test files failed with the same import error.

### Root Cause Analysis

The contract tests import modules using:
```python
from cdk.stacks.network_stack import NetworkStack
from cdk.stacks.database_stack import DatabaseStack
from cdk.stacks.storage_stack import StorageStack
```

However, the CDK code is located in `infra/cdk/`, not at the repository root. The workflow was setting `PYTHONPATH=.` (repository root), which made Python unable to find the `cdk` module.

**Project structure:**
```
bidopsai/
├── infra/
│   ├── cdk/          # CDK code lives here
│   │   ├── stacks/
│   │   │   ├── network_stack.py
│   │   │   ├── database_stack.py
│   │   │   └── ...
│   └── tests/
│       └── contract/
│           ├── test_vpc_contract.py
│           └── ...
```

When `PYTHONPATH=.` is set and pytest runs from the repository root, Python looks for `cdk` at `./cdk/`, but it actually needs to look at `./infra/cdk/`.

### Fix Implementation

**File Modified:** `.github/workflows/deploy.yml`

**Before:**
```yaml
- name: Run contract tests
  run: PYTHONPATH=. pytest infra/tests/contract/ -v
```

**After:**
```yaml
- name: Run contract tests
  run: PYTHONPATH=infra pytest infra/tests/contract/ -v
```

### Verification

**Local Testing:**
```bash
# From repository root
cd /home/vekysilkova/projects/bidopsai

# Run with corrected PYTHONPATH
PYTHONPATH=infra pytest infra/tests/contract/ -v
```

**Result:**
```
============================================= test session starts =============================================
platform linux -- Python 3.12.3, pytest-8.4.2, pluggy-1.6.0 -- /usr/bin/python3
cachedir: .pytest_cache
rootdir: /home/vekysilkova/projects/bidopsai
plugins: cov-7.0.0, typeguard-2.13.3
collected 24 items

infra/tests/contract/test_alb_dns_contract.py::test_alb_dns_contract PASSED                             [  4%]
infra/tests/contract/test_alb_dns_contract.py::test_alb_properties PASSED                               [  8%]
infra/tests/contract/test_database_deployment_contract.py::test_database_deployment_readiness PASSED    [ 12%]
infra/tests/contract/test_database_deployment_contract.py::test_database_deployment_outputs PASSED      [ 16%]
infra/tests/contract/test_ecr_repositories_contract.py::test_ecr_repositories_contract PASSED           [ 20%]
infra/tests/contract/test_ecr_repositories_contract.py::test_ecr_repository_properties PASSED           [ 25%]
infra/tests/contract/test_opensearch_endpoint_contract.py::test_opensearch_endpoint_contract PASSED     [ 29%]
infra/tests/contract/test_opensearch_endpoint_contract.py::test_opensearch_domain_properties PASSED     [ 33%]
infra/tests/contract/test_rds_endpoint_contract.py::test_rds_endpoint_contract PASSED                   [ 37%]
infra/tests/contract/test_rds_endpoint_contract.py::test_rds_cluster_properties PASSED                  [ 41%]
infra/tests/contract/test_s3_buckets_contract.py::test_s3_buckets_contract PASSED                       [ 45%]
infra/tests/contract/test_s3_buckets_contract.py::test_s3_bucket_properties PASSED                      [ 50%]
infra/tests/contract/test_subnets_private_agent_contract.py::test_private_agent_subnets_contract PASSED [ 54%]
infra/tests/contract/test_subnets_private_agent_contract.py::test_private_agent_subnets_properties PASSED [ 58%]
infra/tests/contract/test_subnets_private_app_contract.py::test_private_app_subnets_contract PASSED     [ 62%]
infra/tests/contract/test_subnets_private_app_contract.py::test_private_app_subnets_properties PASSED   [ 66%]
infra/tests/contract/test_subnets_private_data_contract.py::test_private_data_subnets_contract PASSED   [ 70%]
infra/tests/contract/test_subnets_private_data_contract.py::test_private_data_subnets_properties PASSED [ 75%]
infra/tests/contract/test_subnets_public_contract.py::test_public_subnets_contract PASSED               [ 79%]
infra/tests/contract/test_subnets_public_contract.py::test_public_subnets_properties PASSED             [ 83%]
infra/tests/contract/test_vpc_contract.py::test_vpc_endpoint_contract PASSED                            [ 87%]
infra/tests/contract/test_vpc_contract.py::test_vpc_output_schema PASSED                                [ 91%]
infra/tests/contract/test_vpc_deployment_contract.py::test_vpc_deployment_readiness PASSED              [ 95%]
infra/tests/contract/test_vpc_deployment_contract.py::test_vpc_deployment_outputs PASSED                [100%]

============================================= 24 passed in 10.57s =============================================
```

✅ All 24 contract tests passed successfully!

## Workflow Trigger Issue

### Symptom
After pushing the fix, GitHub Actions workflow did not automatically trigger on the Pull Request.

### Investigation
Checked recent commits on PR #4:
```bash
git log --oneline --graph -10
* e7790603 (HEAD -> fix/pipeline, origin/fix/pipeline) Trigger workflow run
* 8fa8ce7a infra deploy tests failing fix
* 24fd97e8 pipeline test fix
* 7abe01c0 ci: update test path
* 8478699d Fix pipeline to use new cdk path
```

Workflow runs were visible for older commits (`7abe01c0`, `f0f2510`) but not for recent commits (`24fd97e8`, `8fa8ce7a`).

### Root Cause
**Merge conflicts** prevented GitHub Actions from running. GitHub does not automatically trigger workflows on Pull Requests that have unresolved merge conflicts with the target branch.

### Resolution
1. Resolved merge conflicts with the `main` branch
2. Added a comment to the workflow file to trigger a new push
3. Pushed commit `e7790603` which successfully triggered the workflow

### Key Finding
⚠️ **GitHub Actions Behavior with Merge Conflicts:**
- Workflows do **NOT** run automatically on PRs with merge conflicts
- The merge conflict must be resolved before workflows will trigger
- No warning or notification is shown in the PR that workflows are blocked
- Previous workflow runs (before the conflict) may still be visible, causing confusion

## Commands Used

```bash
# Navigate to project root
cd /home/vekysilkova/projects/bidopsai

# Check current branch and status
git status
git log --oneline -5

# Verify workflow file content
grep -A 1 "Run contract tests" .github/workflows/deploy.yml

# Run contract tests locally with corrected PYTHONPATH
PYTHONPATH=infra pytest infra/tests/contract/ -v

# Check for uncommitted changes
git diff HEAD -- .github/workflows/deploy.yml

# Verify what's in the latest commit
git show HEAD:.github/workflows/deploy.yml | grep -A 1 "Run contract tests"

# Fetch latest from remote and check
git fetch origin
git show origin/fix/pipeline:.github/workflows/deploy.yml | grep -A 1 "Run contract tests"

# Trigger workflow by adding comment and pushing
git add .github/workflows/deploy.yml
git commit -m "Trigger workflow run"
git push origin fix/pipeline
```

## Related Files Modified

### Primary Fix
- `.github/workflows/deploy.yml` - Changed `PYTHONPATH=.` to `PYTHONPATH=infra`

### Secondary Changes (from troubleshooting)
- `apps/web/package.json` - Added missing `test` and `type-check` scripts for frontend workflow

## Lessons Learned

1. **PYTHONPATH Context Matters**: Always set `PYTHONPATH` relative to where the Python modules actually exist, not where the tests run from

2. **Merge Conflicts Block CI**: GitHub Actions will silently not trigger on PRs with merge conflicts. Always check for and resolve conflicts when workflows don't trigger as expected

3. **Workflow File Changes Require Attention**: When modifying workflow files in a PR, pay special attention to ensure the changes propagate correctly

4. **Local Testing is Critical**: Running tests locally with the exact same command as CI helps catch environment-specific issues before pushing

## Next Steps

- ✅ Pipeline is now functional and all contract tests pass
- ✅ Workflow triggers automatically on new commits (when no merge conflicts exist)
- Monitor future workflow runs to ensure stability
- Consider adding a merge conflict check or notification in the CI process

## Conclusion

The contract tests are now working correctly in GitHub Actions. The fix was simple (correcting the PYTHONPATH), but identifying the issue was complicated by merge conflicts preventing workflow runs. Understanding that merge conflicts block GitHub Actions workflows is important for future troubleshooting.

**Status**: ✅ RESOLVED
**Test Results**: 24/24 contract tests passing
**CI Pipeline**: Fully operational
