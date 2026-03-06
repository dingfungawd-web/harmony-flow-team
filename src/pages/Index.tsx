import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon, AlertTriangle, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const reportingDepts = [
  { value: "sales", label: "銷售部" },
  { value: "measurement", label: "度尺部" },
  { value: "installation", label: "安裝部" },
  { value: "after_sales", label: "售後部" },
] as const;

const receivingDepts = [
  ...reportingDepts,
  { value: "supplier", label: "供應商" },
] as const;

const impactTypes = [
  { id: "labor_delay", label: "工時延誤" },
  { id: "extra_material", label: "額外材料" },
  { id: "customer_complaint", label: "客戶投訴" },
] as const;




const formSchema = z.object({
  caseId: z.string().regex(/^DF\d{7}$/, "請輸入正確格式：DFXXXXXXX（DF後接7位數字）"),
  date: z.date({ required_error: "請選擇日期" }),
  reportingDept: z.string().min(1, "請選擇反映部門"),
  receivingDept: z.string().min(1, "請選擇接收部門"),
  abnormalCategory: z.string().min(1, "請選擇異常情況分類"),
  description: z
    .string()
    .min(1, "請填寫異常事實描述")
    .refine(
      (val) => !/[！？!?]{2,}|垃圾|廢物|白痴|無能|離譜|搞什麼/.test(val),
      "請以客觀事實描述，避免使用情緒性字眼"
    ),
  impactTypes: z.array(z.string()).min(1, "請至少選擇一項影響類型"),
  impactDetail: z.string().min(1, "請填寫影響程度描述"),


  
}).refine((data) => data.reportingDept !== data.receivingDept, {
  message: "反映部門與接收部門不能相同",
  path: ["receivingDept"],
});

type FormValues = z.infer<typeof formSchema>;

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3wzoCuesM3odL4tuhlR_iCRc2eeWeWd5MEMAulnEIGZqQiOk-YbsbpYcZQBEZCkPpXQ/exec";

const submitToGoogleSheets = async (data: FormValues) => {
  const deptLabel = (val: string) =>
    receivingDepts.find((d) => d.value === val)?.label ?? val;


  const impactLabels = (vals: string[]) =>
    vals.map((v) => impactTypes.find((i) => i.id === v)?.label ?? v).join("、");

  const payload = {
    caseId: data.caseId,
    date: format(data.date, "yyyy-MM-dd"),
    reportingDept: deptLabel(data.reportingDept),
    receivingDept: deptLabel(data.receivingDept),
    abnormalCategory: data.abnormalCategory,
    description: data.description,
    impactTypes: impactLabels(data.impactTypes),
    impactDetail: data.impactDetail,


    
  };

  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  });

  return true;
};

const Index = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caseId: "",
      date: new Date(),
      reportingDept: "",
      receivingDept: "",
      abnormalCategory: "",
      description: "",
      impactTypes: [],
      impactDetail: "",


      
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await submitToGoogleSheets(data);
      setSubmitted(true);
      toast.success("異常反映表已成功提交！");
      form.reset();
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      toast.error("提交失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <AlertTriangle className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            DF創意家居 · 跨部門異常反映表
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            請以客觀事實描述異常情況，禁止使用情緒性字眼
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="border-b border-border bg-muted/50 pb-4">
            <CardTitle className="text-lg text-foreground">異常事件資料</CardTitle>
            <CardDescription>所有欄位皆為必填，請完整填寫</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Row 1: Case ID + Date */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="caseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case ID</FormLabel>
                        <FormControl>
                          <Input placeholder="例：DF0000001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>事件日期</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? format(field.value, "yyyy年MM月dd日", { locale: zhTW })
                                  : "選擇日期"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Departments */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="reportingDept"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>反映部門</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="選擇反映部門" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {reportingDepts.map((dept) => (
                              <SelectItem key={dept.value} value={dept.value}>
                                {dept.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receivingDept"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>接收部門</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="選擇接收部門" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {receivingDepts.map((dept) => (
                              <SelectItem key={dept.value} value={dept.value}>
                                {dept.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          不能與反映部門相同
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Abnormal Category */}
                <FormField
                  control={form.control}
                  name="abnormalCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>異常情況分類</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="請先選擇接收部門" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="placeholder_category">待設定分類</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">
                        根據接收部門顯示對應的異常分類選項
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>異常事實描述</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="請以客觀事實描述事件經過，包括時間、地點、涉及人員及具體情況..."
                          className="min-h-[100px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        ⚠️ 禁止情緒性字眼，請用「事實 + 數據」表達
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Impact */}
                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold text-foreground">造成影響</h3>
                  <FormField
                    control={form.control}
                    name="impactTypes"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-sm">影響類型（可複選）</FormLabel>
                        <div className="flex flex-wrap gap-4 pt-1">
                          {impactTypes.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="impactTypes"
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        field.onChange(
                                          checked
                                            ? [...field.value, item.id]
                                            : field.value.filter((v: string) => v !== item.id)
                                        );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="cursor-pointer text-sm font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="impactDetail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">影響程度描述</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="例：因重新度尺導致額外2小時工時，延誤當日其餘3個安裝訂單..."
                            className="min-h-[80px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>







                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || submitted}
                >
                  {submitted ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      已成功提交
                    </>
                  ) : isSubmitting ? (
                    "提交中..."
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      提交異常反映表
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          DF創意家居 · 跨部門異常反映機制 · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Index;
