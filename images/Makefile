# This makefile generates PNG files of different sizes out of a number of SVG
# files. The SVG files are guaranteed to be square images.
#
# One way to generate a PNG file out of an SVG in MacOS is:
#
#	qlmanage -t -s SIZE -o OUTPUT_DIR IMAGE.svg
#
# The output is a file named IMAGE.svg.png
# Which then we can rename to our naming scheme.
# The naming scheme is:
#
#	IMAGE-SIZE.png

BASE_SOURCES    := banned_stack.svg
BASE_NAMES      := $(BASE_SOURCES:.svg=)
SIZES           := 16 32 48 128

# The output files we want to generate
OUTPUT = $(foreach name,$(BASE_NAMES),$(foreach size,$(SIZES),$(name)-$(size).png))

all:
	@echo "Bye"

build: $(OUTPUT)

.PHONY: images
images:
	@echo "== Building images..."
	./prepare-icons.sh
	@echo "== Images built successfully."

# Function to create target rules to generate the PNG files
define make_png_rule
$(1)-$(2).png: $(1).svg
	qlmanage -t -s $(2) -o . $(1).svg
	mv $(1).svg.png $(1)-$(2).png
endef

# The actual rules to generate the PNG files
$(foreach name,$(BASE_NAMES),$(foreach size,$(SIZES),$(eval $(call make_png_rule,$(name),$(size)))))

.PHONY: clean
clean:
	@echo "Cleaning up generated images..."
	@-rm $(OUTPUT)
