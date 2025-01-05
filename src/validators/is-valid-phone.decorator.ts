import { registerDecorator, type ValidationOptions } from 'class-validator';

export const PHONE_NUMBER_REGEXP =
  /\b[+()]?(?<country>62)[+()]?(?<number>[\d]{8,})\b/;

export default function IsValidPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidPhone',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate: (value) => {
          return PHONE_NUMBER_REGEXP.test(value);
        },
        defaultMessage: () => {
          return 'The phone number ($value) is not valid format.';
        },
      },
    });
  };
}
