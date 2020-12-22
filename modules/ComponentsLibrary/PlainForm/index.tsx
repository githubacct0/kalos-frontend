import React, {
  ReactElement,
  useCallback,
  useState,
  ReactNode,
  forwardRef,
  RefObject,
  ForwardedRef,
} from 'react';
import clsx from 'clsx';
import Typography from '@material-ui/core/Typography';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { Props as ButtonProps } from '../Button';
import {
  Field,
  Value as ValueType,
  Option as OptionType,
  Options as OptionsType,
  Type,
  getDefaultValueByType,
} from '../Field';
import './styles.less';

export type Value = ValueType;
export type Option = OptionType;
export type Options = OptionsType;

export type SchemaProps<T> = {
  label?: ReactNode;
  name?: keyof T;
  headline?: boolean;
  description?: string;
  options?: Options;
  required?: boolean;
  helperText?: string;
  multiline?: boolean;
  type?: Type;
  onChange?: (value: Value) => void;
  onFileLoad?: (file: string | ArrayBuffer | null, filename: string) => void;
  actions?: ButtonProps[];
  actionsInLabel?: boolean;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  content?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  technicianAsEmployee?: boolean;
  minutesStep?: number;
};

export type Schema<T> = SchemaProps<T>[][];

export type Validation = { [key: string]: string };

type Style = {
  compact?: boolean;
  fullWidth?: boolean;
};

export interface PlainFormProps<T> extends Style {
  schema: Schema<T>;
  data: T;
  disabled?: boolean;
  readOnly?: boolean;
  error?: ReactNode;
  children?: ReactNode;
  className?: string;
  ref?: RefObject<T> | ForwardedRef<T>;
  inputFieldRefs?: any[];
}

interface Props<T> extends PlainFormProps<T> {
  onChange: (data: T) => void;
  onSubmit?: () => void;
  validations?: Validation;
}

// @ts-ignore
export const PlainForm: <T>(
  props: Props<T>,
) => ReactElement<Props<T>> = forwardRef(
  (
    {
      schema,
      data,
      onChange,
      onSubmit,
      disabled = false,
      readOnly = false,
      compact = false,
      fullWidth = false,
      error,
      validations = {},
      className = '',
      children,
      inputFieldRefs,
    },
    functionRef,
  ) => {
    const theme = useTheme();
    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const [formData, setFormData] = useState(
      schema.reduce(
        (aggr, fields) => ({
          ...aggr,
          ...fields.reduce(
            (aggr, { name, type = 'text' }) =>
              name === undefined
                ? aggr
                : {
                    ...aggr,
                    [name]:
                      data[name] !== undefined
                        ? data[name]
                        : getDefaultValueByType(type),
                  },
            {},
          ),
        }),
        {} as typeof data,
      ),
    );

    const handleChange = useCallback(
      name => (value: Value) => {
        const data = { ...formData, [name]: value };
        setFormData(data);
        const field = schema
          .reduce((aggr, fields) => [...aggr, ...fields], [])
          .find(field => field.name === name);
        if (field && field.onChange) {
          field.onChange(value);
        }
        onChange(data);
      },
      [formData, setFormData, onChange],
    );
    return (
      <form
        className={clsx(className, 'PlainForm', {
          compact,
          fullWidth,
          disabled,
        })}
        onSubmit={event => {
          event.stopPropagation();
          event.preventDefault();
          if (onSubmit) {
            onSubmit();
          }
        }}
      >
        {error && (
          <Typography className="PlainFormError" component="div">
            {error}
          </Typography>
        )}
        {Object.keys(validations).length > 0 && (
          <Typography className="PlainFormError">
            Please correct the following validation errors and try again.
            <span className="PlainFormErrorFields">
              {Object.keys(validations).map(fieldName => (
                <span key={fieldName} className="PlainFormErrorField">
                  <strong>
                    {
                      schema
                        .reduce((aggr, fields) => [...aggr, ...fields], [])
                        .find(({ name }) => name === fieldName)?.label
                    }
                    :{' '}
                  </strong>
                  {validations[fieldName]}
                </span>
              ))}
            </span>
          </Typography>
        )}
        {schema.map((fields, idx) => (
          <div key={idx} className="PlainFormGroup">
            {fields.map((props, idx2) => {
              const { name } = props;
              return (
                <Field
                  ref={functionRef => {
                    inputFieldRefs?.push(functionRef);
                  }}
                  key={`${idx2}-${name}`}
                  {...props}
                  value={name ? formData[name] : undefined}
                  onChange={handleChange(name)}
                  disabled={disabled || props.disabled}
                  validation={validations[name as string]}
                  readOnly={readOnly || props.readOnly}
                  className={idx2 === 0 ? '' : 'PlainFormField'}
                  style={
                    matches
                      ? {
                          width: `calc((100% - ${
                            (fields.length - 1) * 16
                          }px) / ${fields.length})`,
                        }
                      : {}
                  }
                />
              );
            })}
          </div>
        ))}
        {children}
        <button type="submit" className="PlainFormSubmit">
          Submit
        </button>
      </form>
    );
  },
);
