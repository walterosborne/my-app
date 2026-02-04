import { React, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Select from "react-select"
import './App.css'


function App() {

  const { register, handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    control
  } = useForm(
    {
      defaultValues: {
        email: "11@11.com",
        date: '2011-11-11',
        password: 11,
        qty: 12
      }
    }
  )
  const options = [
    { value: "African American Express", label: "African American Express" },
    { value: "Moostercard", label: "Moostercard" },
    { value: "Vasa", label: "Vasa" },
  ];
  const customStyles = {
    control: (provided) => ({
      ...provided, // Keeps previous styles
      width: "100%",
      borderRadius: "8px",
      textAlign: 'left'
    }),
    option: (provided, state) => ({
      ...provided,
      color: "black",
      backgroundColor: (state.isSelected ? "grey" : "white")

    })

  }

  async function onSubmit(data) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(data)
    }
    catch (error) {
      setError("email",
        { message: "email already taken" }
      )
      setError("root",
        { message: "error" }
      )
    }

  }

  return (
    <form className="tutorial gap-2" onSubmit={handleSubmit(onSubmit)}
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', height: '90vh', width: '70vw' }}>
      <label htmlFor="email">Email: </label>
      <input
        {...register("email", {
          required: 'Email is required'
        })}
        type="email"//Text coudlve worked too
        placeholder="Email"
        id='email'
      />
      <input
        {...register("date", {
          required: 'Date is required'
        })}
        type="date"
        placeholder="Date"
        id='date'
      />
      <input
        {...register("qty", {
          required: 'Quantity is required'
        })}
        type="number"
        placeholder="Quantity"
        id='qty'
        min={0}
      />
      <div>
        <label>Mr.</label>
        <input
          {...register("title", {
            required: 'Title is required'
          })} type="radio" name='title' value={'Mr.'} />
        <label>Mrs.</label>
        <input
          {...register("title", {
            required: 'Title is required'
          })} type="radio" name='title' value={'Mrs.'} />
        <label>11.</label>
        <input
          {...register("title", {
            required: 'Title is required'
          })} type="radio" name='title' value={'11.'} />
      </div>
      <Controller
        name="payment"
        control={control}
        rules={{ required: "Payment method is required" }}
        render={({ field }) => (
          <Select
            options={options}
            placeholder="Payment method"
            value={options.find(opt => opt.value === field.value) || null}
            onChange={opt => field.onChange(opt.value)}
            styles={customStyles}
          />
        )}
      />

      {errors.email && <h4 style={{ border: '2px solid red', color: 'red' }}>{errors.email.message}</h4>}
      <input
        {...register("password",
          {
            required: true,
            validate: (value) => {
              if (value.toString().length > 2) {
                return true
              } else {
                return 'Password longer pls'
              }
            }
          }
        )}
        type="password"
        placeholder="Password"
      />
      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Submitting' : 'Submit'}
      </button>
      <button disabled={isSubmitting} type="reset">
        {isSubmitting ? 'Submitting' : 'Reset'}
      </button>
      {errors.password && <h4 style={{ border: '2px solid red', color: 'red' }}>{errors.password.message}</h4>}

    </ form>
  )
}

export default App
