"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function CSVTemplateDownload() {
  const { toast } = useToast()

  const downloadTemplate = () => {
    // Create CSV template content
    const csvContent = `Store,Dept,Date,Weekly_Sales,IsHoliday
1,1,2023-01-06,24215.46,False
1,1,2023-01-13,46039.49,True
1,1,2023-01-20,41595.55,False
1,2,2023-01-06,50605.27,False
1,2,2023-01-13,63756.86,True
1,2,2023-01-20,39954.04,False
2,1,2023-01-06,18567.23,False
2,1,2023-01-13,35234.12,True
2,2,2023-01-06,42156.78,False
2,2,2023-01-13,58923.45,True`

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "walmart_sales_template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Template Downloaded",
      description: "Template CSV berhasil diunduh. Silakan isi dengan data Anda.",
    })
  }

  const downloadSampleData = () => {
    // Create more comprehensive sample data
    const sampleData = `Store,Dept,Date,Weekly_Sales,IsHoliday
1,1,2023-01-06,24215.46,False
1,1,2023-01-13,46039.49,True
1,1,2023-01-20,41595.55,False
1,1,2023-01-27,19403.54,False
1,1,2023-02-03,21827.90,False
1,1,2023-02-10,21043.39,True
1,2,2023-01-06,50605.27,False
1,2,2023-01-13,63756.86,True
1,2,2023-01-20,39954.04,False
1,2,2023-01-27,46426.74,False
1,3,2023-01-06,13740.12,False
1,3,2023-01-13,39954.04,True
1,4,2023-01-06,39954.04,False
1,4,2023-01-13,58300.92,True
1,5,2023-01-06,17596.96,False
1,5,2023-01-13,42960.91,True
2,1,2023-01-06,18567.23,False
2,1,2023-01-13,35234.12,True
2,1,2023-01-20,31876.44,False
2,1,2023-01-27,14852.67,False
2,2,2023-01-06,42156.78,False
2,2,2023-01-13,58923.45,True
2,3,2023-01-06,28934.56,False
2,3,2023-01-13,45678.90,True
3,1,2023-01-06,22345.67,False
3,1,2023-01-13,38901.23,True
3,2,2023-01-06,34567.89,False
3,2,2023-01-13,52345.67,True`

    const blob = new Blob([sampleData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "walmart_sales_sample.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Sample Data Downloaded",
      description: "Data sample berhasil diunduh untuk testing.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Template & Sample Data</span>
        </CardTitle>
        <CardDescription>Download template CSV atau data sample untuk memulai</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Template CSV</h4>
            <p className="text-sm text-gray-600">Template kosong dengan format yang benar</p>
            <Button variant="outline" onClick={downloadTemplate} className="w-full bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Sample Data</h4>
            <p className="text-sm text-gray-600">Data contoh untuk testing dan pembelajaran</p>
            <Button variant="outline" onClick={downloadSampleData} className="w-full bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Download Sample
            </Button>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <h4 className="font-medium mb-1">Format Requirements:</h4>
              <ul className="space-y-1">
                <li>
                  • <strong>Store</strong>: ID Toko (1-45)
                </li>
                <li>
                  • <strong>Dept</strong>: ID Departemen (1-99)
                </li>
                <li>
                  • <strong>Date</strong>: Format YYYY-MM-DD
                </li>
                <li>
                  • <strong>Weekly_Sales</strong>: Penjualan mingguan dalam dollar
                </li>
                <li>
                  • <strong>IsHoliday</strong>: True/False untuk hari libur
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
