export interface FieldConfig {
   key: string;
   label: string;
   type: 'text' | 'email' | 'password';
   placeholder?: string;
   autoComplete?: string;
 }
 
 export interface SubmitResult {
   ok: boolean;
   errors: string[];
 }
 
 export abstract class FormModel {
   abstract readonly fields: FieldConfig[];
   abstract submit(values: Record<string, string>): Promise<SubmitResult>;
 
   validate(values: Record<string, string>): Record<string, string> {
     const fieldErrors: Record<string, string> = {};
     for (const field of this.fields) {
       if (!values[field.key]?.trim()) {
         fieldErrors[field.key] = `${field.label} è obbligatorio`;
       }
     }
     return fieldErrors;
   }
 }
 
 export class LoginModel extends FormModel {
   readonly fields: FieldConfig[] = [
     { key: 'username', label: 'Username',  type: 'text',     placeholder: 'il_tuo_username', autoComplete: 'username'         },
     { key: 'password', label: 'Password',  type: 'password', placeholder: '',                autoComplete: 'current-password' },
   ];
 
   async submit(values: Record<string, string>): Promise<SubmitResult> {
     const { login } = await import('./api');
     return login({ username: values.username, password: values.password });
   }
 }
 
 export class RegisterModel extends FormModel {
   readonly fields: FieldConfig[] = [
     { key: 'username',   label: 'Username',          type: 'text',     placeholder: 'il_tuo_username', autoComplete: 'username'     },
     { key: 'email',      label: 'Email',              type: 'email',    placeholder: 'nome@esempio.it', autoComplete: 'email'        },
     { key: 'password',   label: 'Password',           type: 'password', placeholder: '',                autoComplete: 'new-password' },
     { key: 'confirmPwd', label: 'Conferma Password',  type: 'password', placeholder: '',                autoComplete: 'new-password' },
   ];
 
   async submit(values: Record<string, string>): Promise<SubmitResult> {
     const { register } = await import('./api');
     return register({
       username:   values.username,
       email:      values.email,
       password:   values.password,
       confirmPwd: values.confirmPwd,
     });
   }
 }