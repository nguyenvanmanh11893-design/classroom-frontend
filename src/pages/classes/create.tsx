import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb"
import { CreateView } from "@/components/refine-ui/views/create-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useBack, useList } from "@refinedev/core"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "@refinedev/react-hook-form"
import { classSchema } from "@/lib/schema"
import  * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import UploadWidget from "@/components/upload-widget"
import { Subject, User } from "@/types"

const ClassesCreate = () => {
  const back  = useBack()

  const form = useForm({
    resolver: zodResolver(classSchema),
    refineCoreProps: {
      resource: "classes",
      action: "create",
    },
    defaultValues: {
      capacity: 50,
      status: "active",
      subjectId: undefined,
      teacherId: "",
      bannerUrl: "",
      bannerCldPubId: "",
    },
  })

  const {
    refineCore: { onFinish },
    handleSubmit, 
    formState: { isSubmitting, errors },
    control, 
} = form

  const onSubmit = async (values: z.infer<typeof classSchema>) => {
    try {
      await onFinish(values)
    } catch (e) {
      console.error('Error creating new classes', e)
    }
  }

  //create teachers 
  const { query: subjectsQuery } = useList<Subject>({
    resource: "subjects",
    pagination: {
      pageSize: 100,
    },
  })
  const { query: teachersQuery } = useList<User>({
    resource: "users",
    filters: [{
      field: "role",
      operator: "eq",
      value: "teacher"
    }],
    pagination: {
      pageSize: 100,
    },
  })
  const subjects = subjectsQuery?.data?.data || []
  const subjectsLoading = subjectsQuery.isLoading

  const teachers = teachersQuery?.data?.data || []
  const teachersLoading = teachersQuery.isLoading

  const bannerPublicId = form.watch('bannerCldPubId')
  const setBannerImage = (file: any,field: any) => {
    if (file) {
      field.onChange(file.url)
      form.setValue('bannerCldPubId', file.publicId, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }else {
      field.onChange('')
      form.setValue('bannerCldPubId', '', {
        shouldValidate: true,
        shouldDirty: true,
      })
    }

  }

  return (
    <CreateView className="class-view">
      <Breadcrumb />
      <h1 className="page-title">Create a Class</h1>
      <div className="intro-row">
        <p>Provide the required information to create a new class.</p>
        <Button onClick={ back }> Go Back</Button>
      </div>
      <Separator />
      <div className="my-4 flex items-center">
        <Card className="class-form-card">
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl pb-0 font-bold">
              Fill out the form
            </CardTitle>
          </CardHeader>

          <Separator/>

          <CardContent className="mt-7">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)}
               className="space-y-5">
                <FormField control={control}
                 name="bannerUrl"
                 render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Image <span
                    className="text-orange-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <UploadWidget
                        value={field.value ? { url: field.value, publicId: bannerPublicId ?? '' } : null}
                        onChange={(file: any) => setBannerImage(file, field)}
                        />
                    </FormControl>
                    <FormMessage />
                    {errors.bannerCldPubId && !errors.bannerUrl && (
                      <p className="text-destructive text-sm">{errors.bannerCldPubId.message?.toString()}</p>
                    )}
                  </FormItem>
                )}
                />
                
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name <span
                    className="text-orange-600">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Introduction to Biology - Section A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                  control={control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject <span
                    className="text-orange-600">*</span></FormLabel>
                        <Select onValueChange={( value ) => field.onChange(Number(value))} value={field?.value?.toString()} disabled={subjectsLoading}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id.toString()}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>


                        </Select>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher <span
                    className="text-orange-600">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={teachersLoading}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a teacher" />
                            </SelectTrigger>
                          </FormControl>
                            <SelectContent>
                              {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                  {teacher.name}
                                </SelectItem>
                              ))}
                            </SelectContent>


                        </Select>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />


                </div>
                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe this class" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity <span className="text-orange-600">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status <span className="text-orange-600">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit">Create Class</Button>
              </form>
            </Form>
          </CardContent>

          
        </Card>
      </div>

    </CreateView>
  )
}

export default ClassesCreate