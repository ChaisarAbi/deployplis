"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Zap, Settings, TrendingUp, Play, CheckCircle, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OptimizationRun {
  id: string
  dataset: string
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  startTime: string
  duration?: string
  trials: number
  bestParams?: {
    n_estimators: number
    max_depth: number
    learning_rate: number
    subsample: number
  }
  bestScore?: number
  improvement?: number
}

export function OptimizationPanel() {
  const { toast } = useToast()
  const [selectedDataset, setSelectedDataset] = useState("")
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [maxTrials, setMaxTrials] = useState(50)

  const [optimizationRuns, setOptimizationRuns] = useState<OptimizationRun[]>([
    {
      id: "1",
      dataset: "Sales Data 2023",
      status: "completed",
      progress: 100,
      startTime: "2024-01-15 16:20",
      duration: "25 minutes",
      trials: 50,
      bestParams: {
        n_estimators: 150,
        max_depth: 8,
        learning_rate: 0.08,
        subsample: 0.9,
      },
      bestScore: 0.952,
      improvement: 1.2,
    },
    {
      id: "2",
      dataset: "Sales Data 2022",
      status: "completed",
      progress: 100,
      startTime: "2024-01-14 14:45",
      duration: "32 minutes",
      trials: 75,
      bestParams: {
        n_estimators: 120,
        max_depth: 7,
        learning_rate: 0.12,
        subsample: 0.85,
      },
      bestScore: 0.948,
      improvement: 0.8,
    },
  ])

  const availableDatasets = ["Sales Data 2023", "Sales Data 2022", "Sales Data 2021"]

  const handleStartOptimization = () => {
    if (!selectedDataset) {
      toast({
        title: "Error",
        description: "Please select a dataset for optimization",
        variant: "destructive",
      })
      return
    }

    const newRun: OptimizationRun = {
      id: Date.now().toString(),
      dataset: selectedDataset,
      status: "running",
      progress: 0,
      startTime: new Date().toLocaleString(),
      trials: maxTrials,
    }

    setOptimizationRuns([newRun, ...optimizationRuns])
    setIsOptimizing(true)

    toast({
      title: "Optimization Started",
      description: `Bayesian optimization started for ${selectedDataset} with ${maxTrials} trials`,
    })

    // Simulate optimization progress
    const interval = setInterval(() => {
      setOptimizationRuns((prev) =>
        prev.map((run) => {
          if (run.id === newRun.id && run.status === "running") {
            const newProgress = Math.min(run.progress + Math.random() * 8, 100)
            return { ...run, progress: newProgress }
          }
          return run
        }),
      )
    }, 1500)

    // Complete optimization
    setTimeout(() => {
      clearInterval(interval)
      setOptimizationRuns((prev) =>
        prev.map((run) =>
          run.id === newRun.id
            ? {
                ...run,
                status: "completed",
                progress: 100,
                duration: `${Math.floor(Math.random() * 20) + 15} minutes`,
                bestParams: {
                  n_estimators: Math.floor(Math.random() * 100) + 100,
                  max_depth: Math.floor(Math.random() * 5) + 5,
                  learning_rate: Math.round((0.05 + Math.random() * 0.15) * 100) / 100,
                  subsample: Math.round((0.8 + Math.random() * 0.2) * 100) / 100,
                },
                bestScore: Math.round((0.94 + Math.random() * 0.02) * 1000) / 1000,
                improvement: Math.round((Math.random() * 2 + 0.5) * 10) / 10,
              }
            : run,
        ),
      )
      setIsOptimizing(false)
      setSelectedDataset("")
      toast({
        title: "Optimization Completed",
        description: "Bayesian optimization completed with improved parameters",
      })
    }, 12000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-blue-600">Running</Badge>
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bayesian Optimization</h2>
        <p className="text-gray-600">Optimize XGBoost hyperparameters using Optuna</p>
      </div>

      {/* Optimization Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Optimization Configuration</span>
          </CardTitle>
          <CardDescription>Configure and start Bayesian optimization for hyperparameter tuning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Dataset</label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isOptimizing}
              >
                <option value="">Choose dataset...</option>
                {availableDatasets.map((dataset) => (
                  <option key={dataset} value={dataset}>
                    {dataset}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Trials</label>
              <input
                type="number"
                value={maxTrials}
                onChange={(e) => setMaxTrials(Number.parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isOptimizing}
                min="10"
                max="200"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleStartOptimization} disabled={isOptimizing || !selectedDataset} className="w-full">
                {isOptimizing ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-pulse" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Optimization
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Optimization Parameters:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700">
              <div>
                <strong>n_estimators:</strong> 50-200
              </div>
              <div>
                <strong>max_depth:</strong> 3-10
              </div>
              <div>
                <strong>learning_rate:</strong> 0.01-0.3
              </div>
              <div>
                <strong>subsample:</strong> 0.6-1.0
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Optimization History</span>
          </CardTitle>
          <CardDescription>Track optimization runs and their results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizationRuns.map((run) => (
              <div key={run.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium">{run.dataset}</h4>
                      <p className="text-sm text-gray-500">
                        Started: {run.startTime} • {run.trials} trials
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(run.status)}
                    {run.duration && <Badge variant="outline">{run.duration}</Badge>}
                    {run.improvement && <Badge className="bg-green-600">+{run.improvement}% improvement</Badge>}
                  </div>
                </div>

                {run.status === "running" && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Optimization Progress</span>
                      <span>{Math.round(run.progress)}%</span>
                    </div>
                    <Progress value={run.progress} className="h-2" />
                  </div>
                )}

                {run.bestParams && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                        Best Parameters
                      </h5>
                      <div className="text-xs space-y-1 text-gray-600 bg-gray-50 p-3 rounded">
                        <div>n_estimators: {run.bestParams.n_estimators}</div>
                        <div>max_depth: {run.bestParams.max_depth}</div>
                        <div>learning_rate: {run.bestParams.learning_rate}</div>
                        <div>subsample: {run.bestParams.subsample}</div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                        Performance
                      </h5>
                      <div className="text-xs space-y-1 text-gray-600 bg-gray-50 p-3 rounded">
                        <div>Best Score: {run.bestScore?.toFixed(3)}</div>
                        <div>Trials Completed: {run.trials}</div>
                        <div>Improvement: +{run.improvement}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
