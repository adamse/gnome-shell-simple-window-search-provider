SCHEMAS = schemas/preferences.gschema.xml
OUTPUTS = extension.js schemas/gschemas.compiled

all: $(OUTPUTS)

schemas/gschemas.compiled: $(SCHEMAS)
	glib-compile-schemas schemas/

.PHONY: clean
clean:
	$(RM) $(OUTPUTS)

%.js: %.ts
	tsc --outFile $@ $^

