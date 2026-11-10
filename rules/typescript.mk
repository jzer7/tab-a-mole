# ----------------------------------------------------------
# typescript.mk
# ----------------------------------------------------------
# Reusable TypeScript targets built on `bun` (with `bunx` for
# one-off binaries: eslint, prettier, tsc, vitest).
# Hooks into the shared top-level targets from `targets.mk`
# (setup, lint, test, format-check, format-fix, build, clean,
# distclean). Override variables below in the including
# Makefile to adapt to a project's layout.
# ----------------------------------------------------------

# ----------------------------------------------------------
# CONFIGURATION
# ----------------------------------------------------------

TS_PKG_MANAGER      ?= bun
TS_LINT_GLOB        ?= .
TS_FORMAT_GLOB      ?= .
TS_TEST_ARGS        ?= --coverage
TS_BUILD_SCRIPT     ?= build
TS_PACKAGE_SCRIPT   ?= zip
TS_TYPECHECK_SCRIPT ?= tsc --noEmit
TS_DIST_DIR         ?= dist
TS_COVERAGE_DIR     ?= coverage
TS_NODE_MODULES_DIR ?= node_modules
TS_HAS_BUILD        ?= 1

# ----------------------------------------------------------
# STANDARD TARGETS
# ----------------------------------------------------------

.PHONY: setup build qa lint test format-check format-fix clean distclean
setup::         ts-setup
ifeq ($(TS_HAS_BUILD),1)
build::         ts-build
endif
qa::            ts-dependencies-audit
lint::          ts-lint ts-typecheck
test::          ts-test
format-check::  ts-format-check
format-fix::    ts-format-fix
clean::         ts-clean
distclean::     ts-distclean

# ----------------------------------------------------------
# SETUP
# ----------------------------------------------------------

.PHONY: ts-setup
ts-setup:  ## ⚙️ Install TypeScript dependencies
	@echo "== Installing TypeScript dependencies..."
	$(TS_PKG_MANAGER) install
	@echo "== TypeScript dependencies installed."

.PHONY: ts-setup-dev
ts-setup-dev:  ## ⚙️ Install TypeScript development dependencies
	@echo "== Installing TypeScript development dependencies..."
	$(TS_PKG_MANAGER) install --dev
	@echo "== TypeScript development dependencies installed."

# ----------------------------------------------------------
# DEPENDENCY MANAGEMENT
# ----------------------------------------------------------

.PHONY: ts-update
ts-update:  ## 📦 Update dependencies
	@echo "== Updating dependencies..."
	$(TS_PKG_MANAGER) update --no-progress
	@echo "== Dependency update completed."

.PHONY: ts-update-latest
ts-update-latest:  ## 📦 Update dependencies to their latest versions
	@echo "== Updating dependencies to latest versions..."
	$(TS_PKG_MANAGER) update --latest --no-progress
	@echo "== Dependency update completed."

.PHONY: ts-update-dry-run
ts-update-dry-run:  ## 📦 Preview dependency updates without applying them
	@echo "== Previewing dependency updates..."
	$(TS_PKG_MANAGER) update --latest --no-progress --dry-run
	@echo "== Dependency update preview completed."

.PHONY: ts-dependencies-audit
ts-dependencies-audit:  ## 📦 Audit dependencies for security vulnerabilities
	@echo "== Auditing dependencies for security vulnerabilities..."
	$(TS_PKG_MANAGER) audit > /dev/null 2>&1 || $(TS_PKG_MANAGER) audit
	@echo "== Dependency audit completed."

# ----------------------------------------------------------
# LINT
# ----------------------------------------------------------

.PHONY: ts-lint
ts-lint:  ## 🧹 Lint TypeScript files
	@echo "== Linting TypeScript files..."
	bunx eslint $(TS_LINT_GLOB)
	@echo "== Linting completed."

.PHONY: ts-lint-fix
ts-lint-fix:  ## 🧹 Lint and autofix TypeScript files
	@echo "== Fixing lint issues in TypeScript files..."
	bunx eslint --fix $(TS_LINT_GLOB)
	@echo "== Lint autofix completed."

.PHONY: ts-typecheck
ts-typecheck:  ## 🔍 Type-check the project without emitting output
	@echo "== Type-checking TypeScript files..."
	$(TS_PKG_MANAGER) run $(TS_TYPECHECK_SCRIPT)
	@echo "== Type-check completed."

# ----------------------------------------------------------
# FORMATTING
# ----------------------------------------------------------

.PHONY: ts-format-check
ts-format-check:  ## 🎨 Check formatting of project files
	@echo "== Checking formatting..."
	bunx prettier --check $(TS_FORMAT_GLOB)
	@echo "== Format check completed."

.PHONY: ts-format-fix
ts-format-fix:  ## 🎨 Fix formatting of project files
	@echo "== Fixing formatting..."
	bunx prettier --write $(TS_FORMAT_GLOB)
	@echo "== Format fix completed."

# ----------------------------------------------------------
# TESTS
# ----------------------------------------------------------

.PHONY: ts-test
ts-test:  ## 🧪 Run TypeScript tests
	@echo "== Running tests..."
	#bunx vitest run $(TS_TEST_ARGS)
	$(TS_PKG_MANAGER) test $(TS_TEST_ARGS)
	@echo "== Tests completed."

.PHONY: ts-benchmark
ts-benchmark:  ## 🧪 Run only the TypeScript benchmarks

# ----------------------------------------------------------
# BUILD
# ----------------------------------------------------------

.PHONY: ts-build
ts-build:  ## 🚜️ Build the TypeScript project
	@echo "== Building project..."
	$(TS_PKG_MANAGER) run $(TS_BUILD_SCRIPT)
	@echo "== Build completed."

.PHONY: ts-package
ts-package:  ## 🚜️ Package the TypeScript project
	@echo "== Packaging project..."
	$(TS_PKG_MANAGER) run $(TS_PACKAGE_SCRIPT)
	@echo "== Packaging completed."

# ----------------------------------------------------------
# CLEANUP
# ----------------------------------------------------------

.PHONY: ts-clean
ts-clean:  ## 🧹 Remove build and test artifacts
	@echo "== Cleaning up build artifacts..."
	$(RM) -r $(TS_DIST_DIR)
	$(RM) -r $(TS_COVERAGE_DIR)

.PHONY: ts-distclean
ts-distclean: ts-clean  ## 🧹 Remove all generated files, including dependencies
	@echo "== Cleaning up all generated files..."
	$(RM) -r $(TS_NODE_MODULES_DIR)
