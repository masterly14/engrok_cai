"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectValue, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, PhoneCall, CalendarIcon, Clock } from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { startCall } from "@/actions/vapi/calls"

type Props = {
  phoneNumberId: string
  phoneNumberVapiId: string
  assistans: any
}

const countryCodes = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+52", country: "MX", flag: "🇲🇽" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+44", country: "GB", flag: "🇬🇧" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+54", country: "AR", flag: "🇦🇷" },
  { code: "+57", country: "CO", flag: "🇨🇴" },
  { code: "+51", country: "PE", flag: "🇵🇪" },
  { code: "+56", country: "CL", flag: "🇨🇱" },
]

// Generar horas (00-23)
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))

// Generar minutos (00, 15, 30, 45)
const minutes = ["00", "15", "30", "45"]

const CreateCall = ({ phoneNumberId, phoneNumberVapiId, assistans }: Props) => {
  const [countryCode, setCountryCode] = useState("+1")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedAssistant, setSelectedAssistant] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [callType, setCallType] = useState("now") // "now" or "scheduled"
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedHour, setSelectedHour] = useState("09")
  const [selectedMinute, setSelectedMinute] = useState("00")
  const [isLoading, setIsLoading] = useState(false)

  // Get current date and time
  const now = new Date()
  const currentHour = now.getHours().toString().padStart(2, "0")
  const currentMinute = Math.ceil(now.getMinutes() / 15) * 15 % 60
  const currentMinuteStr = currentMinute.toString().padStart(2, "0")

  // Filter hours based on selected date
  const getAvailableHours = () => {
    if (!selectedDate) return hours
    
    const isToday = selectedDate.toDateString() === now.toDateString()
    if (!isToday) return hours
    
    return hours.filter(hour => parseInt(hour) > parseInt(currentHour))
  }

  // Filter minutes based on selected date and hour
  const getAvailableMinutes = () => {
    if (!selectedDate) return minutes
    
    const isToday = selectedDate.toDateString() === now.toDateString()
    if (!isToday) return minutes
    
    const selectedHourInt = parseInt(selectedHour)
    if (selectedHourInt > parseInt(currentHour)) return minutes
    
    return minutes.filter(minute => parseInt(minute) > parseInt(currentMinuteStr))
  }

  // Update selected time when date changes
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const isToday = date.toDateString() === now.toDateString()
      if (isToday) {
        setSelectedHour(currentHour)
        setSelectedMinute(currentMinuteStr)
      } else {
        setSelectedHour("09")
        setSelectedMinute("00")
      }
    }
  }

  const handleCall = async () => {
    setIsLoading(true)
    try {
      const callData = {
        phoneNumber: countryCode + phoneNumber,
        assistantId: selectedAssistant,
        type: callType,
        scheduled: callType === "scheduled" ? true : false,
        ...(callType === "scheduled" &&
          selectedDate && {
            scheduledFor: {
              date: format(selectedDate, "yyyy-MM-dd"),
              time: `${selectedHour}:${selectedMinute}`,
              datetime: new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                Number.parseInt(selectedHour),
                Number.parseInt(selectedMinute),
              ).toISOString(),
            },
          }),
        phoneNumberId,
        phoneNumberVapiId,
        createdAt: new Date().toISOString(),
      }
      console.log("Call Data:", callData)
      
      const response = await startCall(phoneNumberVapiId, callData)
      
      if (response) {
        const { call, message } = response
        console.log("Call Data JSON:", JSON.stringify(callData, null, 2))
        console.log("Call:", call)
        console.log("Message:", message)
      }
      setIsOpen(false)
    } catch (error) {
      console.error("Error making call:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid =
    phoneNumber.trim() !== "" &&
    selectedAssistant !== "" &&
    (callType === "now" || (callType === "scheduled" && selectedDate))

  const getScheduledDateTime = () => {
    if (!selectedDate) return null
    return new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      Number.parseInt(selectedHour),
      Number.parseInt(selectedMinute),
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-black via-emerald-900 to-black border border-emerald-500/30 hover:border-emerald-400/50 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200">
          <Phone className="h-4 w-4 mr-2" />
          Llamar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PhoneCall className="h-5 w-5 text-emerald-600" />
            Configurar llamada
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Configura los detalles de tu llamada</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Número de teléfono */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Número de teléfono</Label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span className="font-mono text-sm">{country.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Número de teléfono"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1"
                type="tel"
              />
            </div>
          </div>

          {/* Asistente */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Asistente</Label>
            <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un asistente" />
              </SelectTrigger>
              <SelectContent>
                {assistans.length > 0 ? (
                  assistans.map((assistant: any) => (
                    <SelectItem key={assistant.vapiId} value={assistant.vapiId}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        {assistant.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-assistants" disabled>
                    No tienes asistentes creados
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Programación de llamada */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Programación</Label>
            <Tabs value={callType} onValueChange={setCallType} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="now" className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" />
                  Ahora
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Programar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="now" className="mt-4">
                <Card>
                  <CardContent className="">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PhoneCall className="h-4 w-4" />
                      La llamada se realizará inmediatamente
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scheduled" className="mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Calendario */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          Fecha
                        </Label>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          className="rounded-md border"
                        />
                      </div>

                      {/* Selector de hora */}
                      <div className="space-y-4">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Hora
                        </Label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Hora</Label>
                            <Select value={selectedHour} onValueChange={setSelectedHour}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableHours().map((hour) => (
                                  <SelectItem key={hour} value={hour}>
                                    {hour}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Minutos</Label>
                            <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableMinutes().map((minute) => (
                                  <SelectItem key={minute} value={minute}>
                                    {minute}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {selectedDate && (
                          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <div className="text-sm font-medium text-emerald-800">Llamada programada para:</div>
                            <div className="text-sm text-emerald-700">
                              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                            </div>
                            <div className="text-sm text-emerald-700">
                              {selectedHour}:{selectedMinute}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleCall}
            disabled={!isFormValid || isLoading}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Procesando...
              </>
            ) : callType === "now" ? (
              <>
                <PhoneCall className="h-4 w-4 mr-2" />
                Llamar ahora
              </>
            ) : (
              <>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Programar llamada
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateCall
