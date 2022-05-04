import type { FormProps } from "remix-forms";
import { Form as RemixForm } from "remix-forms";
import type { SomeZodObject } from "zod";

export default function Form<Schema extends SomeZodObject>(
  props: FormProps<Schema>
) {
  return (
    <RemixForm<Schema>
      {...props}
      buttonComponent={(props) => <button className="button" {...props} />}
      errorComponent={(props) => (
        <span role="alert" className="form-validation-error" {...props} />
      )}
    />
  );
}
