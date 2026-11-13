"use client";

import { useCms } from "./CmsProvider";
import SectionEditor from "./SectionEditor";
import ListEditor from "./ListEditor";
import { cleanObject, validateFields, type FieldDef, type FieldErrors, type Obj } from "./fields";

/** validate a whole list: returns errors per item index */
export function validateList(items: Obj[], defs: FieldDef[]) {
  const errors: Record<number, FieldErrors> = {};
  let count = 0;
  items.forEach((it, i) => {
    const e = validateFields(defs, it);
    const n = Object.keys(e).length;
    if (n) {
      errors[i] = e;
      count += n;
    }
  });
  return { errors, count };
}

interface Props {
  /** key inside the saved content, e.g. "partners" */
  sectionKey: string;
  title: string;
  intro?: string;
  viewHref?: string;
  /** singular word, e.g. "partner" */
  noun: string;
  defs: FieldDef[];
  newItem: () => Obj;
  titleOf: (item: Obj) => string;
  subtitleOf?: (item: Obj) => React.ReactNode;
  /** photo link shown as a small picture in the list */
  thumbOf?: (item: Obj) => string;
  /** tidy one item before saving (default: trim text and drop empty values) */
  normalizeItem?: (item: Obj) => Obj;
}

/** A complete "edit this list" section: draft, validation, Save / Discard / Reset, add / reorder / delete. */
export default function ListSection(p: Props) {
  const cms = useCms();
  const initial = (((cms.effective as unknown as Obj)[p.sectionKey] ?? []) as Obj[]);

  return (
    <SectionEditor<Obj[], Record<number, FieldErrors>>
      sectionKey={p.sectionKey}
      title={p.title}
      intro={p.intro}
      viewHref={p.viewHref}
      initial={initial}
      validate={(d) => validateList(d, p.defs)}
      normalize={(d) => d.map((it) => (p.normalizeItem ? p.normalizeItem(it) : cleanObject(it)))}
    >
      {({ draft, setDraft, errors }) => (
        <ListEditor
          items={draft}
          onChange={setDraft}
          defs={p.defs}
          noun={p.noun}
          errors={errors}
          newItem={p.newItem}
          title={p.titleOf}
          subtitle={p.subtitleOf}
          thumb={p.thumbOf}
        />
      )}
    </SectionEditor>
  );
}